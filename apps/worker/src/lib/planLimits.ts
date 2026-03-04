import type { Env } from '../index'

export const PLAN_LIMITS = {
  free: {
    testimonials: 25,
    widgets: 1,
  },
  pro: {
    testimonials: Infinity,
    widgets: Infinity,
  },
} as const

type LimitAction = 'add_testimonial' | 'create_widget'

interface PlanLimitError {
  error: 'plan_limit'
  limit: string
  current: number
  max: number
  upgrade_url: string
}

export async function checkPlanLimit(
  env: Env,
  accountId: string,
  action: LimitAction
): Promise<PlanLimitError | null> {
  const account = await env.DB.prepare(
    'SELECT plan FROM accounts WHERE id = ?'
  ).bind(accountId).first<{ plan: string }>()

  const plan = (account?.plan || 'free') as keyof typeof PLAN_LIMITS
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free

  if (action === 'add_testimonial') {
    const max = limits.testimonials
    if (max === Infinity) return null // pro, no limit

    const row = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM testimonials WHERE account_id = ?'
    ).bind(accountId).first<{ count: number }>()
    const current = row?.count ?? 0

    if (current >= max) {
      return {
        error: 'plan_limit',
        limit: 'testimonials',
        current,
        max,
        upgrade_url: '/billing',
      }
    }
  }

  if (action === 'create_widget') {
    const max = limits.widgets
    if (max === Infinity) return null // pro, no limit

    const row = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM widgets WHERE account_id = ?'
    ).bind(accountId).first<{ count: number }>()
    const current = row?.count ?? 0

    if (current >= max) {
      return {
        error: 'plan_limit',
        limit: 'widgets',
        current,
        max,
        upgrade_url: '/billing',
      }
    }
  }

  return null
}

/** Returns the plan for an account */
export async function getAccountPlan(env: Env, accountId: string): Promise<'free' | 'pro'> {
  const account = await env.DB.prepare(
    'SELECT plan FROM accounts WHERE id = ?'
  ).bind(accountId).first<{ plan: string }>()
  return (account?.plan === 'pro') ? 'pro' : 'free'
}
