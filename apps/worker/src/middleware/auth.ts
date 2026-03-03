import type { Context, Next } from 'hono'
import type { Env, Variables } from '../index'

export async function authMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next): Promise<Response | void> {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = auth.slice(7)
  const parts = token.split('.')
  if (parts.length !== 3) return c.json({ error: 'Unauthorized' }, 401)
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))) as { sub: string; exp: number; plan?: string }
    if (payload.exp < Math.floor(Date.now() / 1000)) return c.json({ error: 'Token expired' }, 401)
    c.set('accountId', payload.sub)
    c.set('plan', payload.plan || 'free')
  } catch {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}
