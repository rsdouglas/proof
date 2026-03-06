import type { Context, Next } from 'hono'
import type { Env, Variables } from '../index'
import { verifyToken } from '../routes/auth'

export async function authMiddleware(c: Context<{ Bindings: Env; Variables: Variables }>, next: Next): Promise<Response | void> {
  const auth = c.req.header('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const token = auth.slice(7)

  // Verify HMAC signature — do NOT just decode without verification
  const claims = await verifyToken(token, c.env.JWT_SECRET)
  if (!claims) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  c.set('accountId', claims.sub)
  c.set('plan', claims.plan || 'free')
  await next()
}
