import { Hono } from 'hono'
import type { Env, Variables } from '../index'

export const billing = new Hono<{ Bindings: Env; Variables: Variables }>()

// ─── Stripe helpers ───────────────────────────────────────────────────────────

const STRIPE_API = 'https://api.stripe.com/v1'

async function stripePost(env: Env, path: string, params: Record<string, string>): Promise<Response> {
  const body = new URLSearchParams(params).toString()
  return fetch(`${STRIPE_API}${path}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
}


async function getOrCreateCustomer(env: Env, accountId: string, email: string, name: string): Promise<string> {
  // Check if customer already exists
  const account = await env.DB.prepare(
    'SELECT stripe_customer_id FROM accounts WHERE id = ?'
  ).bind(accountId).first<{ stripe_customer_id: string | null }>()

  if (account?.stripe_customer_id) return account.stripe_customer_id

  // Create new Stripe customer
  const res2 = await stripePost(env, '/customers', {
    email,
    name,
    'metadata[account_id]': accountId,
  })

  const customer = await res2.json<{ id: string }>()
  const customerId = customer.id

  // Save to DB
  await env.DB.prepare(
    'UPDATE accounts SET stripe_customer_id = ? WHERE id = ?'
  ).bind(customerId, accountId).run()

  return customerId
}

// ─── POST /api/billing/checkout ───────────────────────────────────────────────

billing.post('/checkout', async (c) => {
  // If Stripe not configured, return pro-waitlist signal
  if (!c.env.STRIPE_SECRET_KEY) {
    return c.json({ pro_waitlist: true, message: 'Stripe not yet configured — join Pro waitlist' }, 402)
  }

  const accountId = c.get('accountId')
  const account = await c.env.DB.prepare(
    'SELECT id, name, email, plan FROM accounts WHERE id = ?'
  ).bind(accountId).first<{ id: string; name: string; email: string; plan: string }>()

  if (!account) return c.json({ error: 'Account not found' }, 404)
  if (account.plan === 'pro') return c.json({ error: 'Already on Pro plan' }, 400)

  const customerId = await getOrCreateCustomer(c.env, accountId, account.email, account.name)

  const origin = c.req.header('origin') || 'https://app.socialproof.dev'

  const res = await stripePost(c.env, '/checkout/sessions', {
    mode: 'subscription',
    customer: customerId,
    'line_items[0][price]': c.env.STRIPE_PRO_PRICE_ID,
    'line_items[0][quantity]': '1',
    success_url: `${origin}/dashboard/settings?upgraded=1`,
    cancel_url: `${origin}/dashboard/settings?canceled=1`,
    'subscription_data[metadata][account_id]': accountId,
    allow_promotion_codes: 'true',
  })

  if (!res.ok) {
    const err = await res.json<{ error: { message: string } }>()
    console.error('Stripe checkout error:', err)
    return c.json({ error: 'Failed to create checkout session' }, 500)
  }

  const session = await res.json<{ url: string; id: string }>()
  return c.json({ url: session.url })
})

// ─── GET /api/billing/portal ──────────────────────────────────────────────────

billing.get('/portal', async (c) => {
  const accountId = c.get('accountId')
  const account = await c.env.DB.prepare(
    'SELECT stripe_customer_id FROM accounts WHERE id = ?'
  ).bind(accountId).first<{ stripe_customer_id: string | null }>()

  if (!account?.stripe_customer_id) {
    return c.json({ error: 'No billing account found. Please upgrade first.' }, 404)
  }

  const origin = c.req.header('origin') || 'https://app.socialproof.dev'

  const res = await stripePost(c.env, '/billing_portal/sessions', {
    customer: account.stripe_customer_id,
    return_url: `${origin}/dashboard/settings`,
  })

  if (!res.ok) {
    const err = await res.json<{ error: { message: string } }>()
    console.error('Stripe portal error:', err)
    return c.json({ error: 'Failed to create portal session' }, 500)
  }

  const session = await res.json<{ url: string }>()
  return c.json({ url: session.url })
})

// ─── POST /api/billing/webhook ────────────────────────────────────────────────

billing.post('/webhook', async (c) => {
  const sig = c.req.header('stripe-signature')
  if (!sig) return c.json({ error: 'No signature' }, 400)

  const body = await c.req.text()

  // Verify Stripe webhook signature using WebCrypto
  try {
    await verifyStripeSignature(body, sig, c.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return c.json({ error: 'Invalid signature' }, 400)
  }

  const event = JSON.parse(body) as StripeEvent

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as CheckoutSession
      if (session.mode !== 'subscription') break
      const accountId = session.subscription_data_metadata_account_id
        ?? session.metadata?.account_id
      if (!accountId) {
        // Fall back to customer lookup
        await upgradePlanByCustomer(c.env, session.customer as string, session.subscription as string)
      } else {
        await c.env.DB.prepare(
          `UPDATE accounts SET plan = 'pro', plan_status = 'active',
           stripe_subscription_id = ?, plan_updated_at = ? WHERE id = ?`
        ).bind(session.subscription, new Date().toISOString(), accountId).run()
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Subscription
      const accountId = sub.metadata?.account_id
      if (accountId) {
        const isActive = sub.status === 'active' || sub.status === 'trialing'
        await c.env.DB.prepare(
          `UPDATE accounts SET plan = ?, plan_status = ?, stripe_subscription_id = ?, plan_updated_at = ? WHERE id = ?`
        ).bind(
          isActive ? 'pro' : 'free',
          sub.status,
          sub.id,
          new Date().toISOString(),
          accountId
        ).run()
      }
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Subscription
      // Look up by subscription ID
      await c.env.DB.prepare(
        `UPDATE accounts SET plan = 'free', plan_status = 'canceled',
         stripe_subscription_id = NULL, plan_updated_at = ? WHERE stripe_subscription_id = ?`
      ).bind(new Date().toISOString(), sub.id).run()
      break
    }

    case 'invoice.payment_failed': {
      const inv = event.data.object as Invoice
      if (inv.subscription) {
        await c.env.DB.prepare(
          `UPDATE accounts SET plan_status = 'past_due', plan_updated_at = ? WHERE stripe_subscription_id = ?`
        ).bind(new Date().toISOString(), inv.subscription).run()
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const inv = event.data.object as Invoice
      if (inv.subscription) {
        await c.env.DB.prepare(
          `UPDATE accounts SET plan_status = 'active', plan_updated_at = ? WHERE stripe_subscription_id = ?`
        ).bind(new Date().toISOString(), inv.subscription).run()
      }
      break
    }
  }

  return c.json({ received: true })
})

// ─── Stripe signature verification ───────────────────────────────────────────

async function verifyStripeSignature(payload: string, header: string, secret: string): Promise<void> {
  const parts = Object.fromEntries(header.split(',').map(p => p.split('=')))
  const timestamp = parts['t']
  const expectedSig = parts['v1']

  if (!timestamp || !expectedSig) throw new Error('Invalid signature header')

  // Check timestamp freshness (5 minute tolerance)
  const ts = parseInt(timestamp)
  if (Math.abs(Date.now() / 1000 - ts) > 300) throw new Error('Timestamp too old')

  const signed = `${timestamp}.${payload}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed))
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')

  if (computed !== expectedSig) throw new Error('Signature mismatch')
}

async function upgradePlanByCustomer(env: Env, customerId: string, subscriptionId: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE accounts SET plan = 'pro', plan_status = 'active',
     stripe_customer_id = ?, stripe_subscription_id = ?, plan_updated_at = ? 
     WHERE stripe_customer_id = ?`
  ).bind(customerId, subscriptionId, new Date().toISOString(), customerId).run()
}

// ─── GET /api/billing/status ──────────────────────────────────────────────────

billing.get('/status', async (c) => {
  const accountId = c.get('accountId')
  const account = await c.env.DB.prepare(
    'SELECT plan, plan_status, plan_updated_at FROM accounts WHERE id = ?'
  ).bind(accountId).first<{ plan: string; plan_status: string; plan_updated_at: string | null }>()

  if (!account) return c.json({ error: 'Not found' }, 404)
  return c.json({
    plan: account.plan,
    status: account.plan_status,
    updatedAt: account.plan_updated_at,
  })
})


// ─── POST /api/billing/pro-waitlist ───────────────────────────────────────────

billing.post('/pro-waitlist', async (c) => {
  let body: { email?: string }
  try { body = await c.req.json() } catch { return c.json({ error: 'Invalid JSON' }, 400) }

  const email = body.email?.toLowerCase().trim()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Valid email required' }, 400)
  }

  // Store in KV with pro-waitlist prefix (idempotent)
  await c.env.WIDGET_KV.put(`pro-waitlist:${email}`, JSON.stringify({
    email,
    joined_at: new Date().toISOString(),
  }), { expirationTtl: 60 * 60 * 24 * 365 }) // 1 year TTL

  return c.json({ ok: true, message: 'Added to Pro waitlist' })
})

// ─── Type stubs ───────────────────────────────────────────────────────────────

type StripeEvent = {
  type: string
  data: { object: unknown }
}

type CheckoutSession = {
  mode: string
  customer: string | null
  subscription: string | null
  metadata: Record<string, string> | null
  subscription_data_metadata_account_id?: string
}

type Subscription = {
  id: string
  status: string
  metadata: Record<string, string> | null
}

type Invoice = {
  subscription: string | null
}
