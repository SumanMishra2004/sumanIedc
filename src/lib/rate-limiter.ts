import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '@/lib/redis'

/**
 * Login rate limiter:
 * 5 requests per 1-minute sliding window
 * keyed by IP + email to catch both distributed and per-account abuse
 */
export const loginRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, '1 m'),
  analytics: true,
  prefix: 'ratelimit:login',
})

/**
 * Register rate limiter:
 * 5 requests per 1-minute sliding window
 */
export const registerRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(15, '1 m'),
  analytics: true,
  prefix: 'ratelimit:register',
})
