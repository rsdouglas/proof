/**
 * KV-backed rate limiter.
 * Uses Cloudflare KV for atomic-ish counting within a time window.
 *
 * @param kv       - KV namespace to use for rate limit counters
 * @param key      - unique key identifying the rate-limited action + actor
 * @param limit    - max requests allowed within the window
 * @param windowSecs - sliding window size in seconds
 * @returns true if the request is allowed, false if rate-limited
 */
export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  limit: number,
  windowSecs: number
): Promise<boolean> {
  const raw = await kv.get(key)
  const count = raw ? parseInt(raw, 10) : 0
  if (count >= limit) return false
  await kv.put(key, String(count + 1), { expirationTtl: windowSecs })
  return true
}
