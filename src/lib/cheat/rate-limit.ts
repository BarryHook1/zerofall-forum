// Very simple in-process rate limiter for /api/cheat/auth/login.
// Keyed by IP; sliding window. Good enough for a single Vercel region;
// swap for Redis / Upstash if you ever scale horizontally.
//
// NOTE: Vercel serverless may spin up multiple instances, so these
// counters are per-instance. Brute-force protection is therefore
// best-effort; combine with CheatAuthLog-based alerting for real defense.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

export function rateLimitByIp(
  ip: string,
  maxAttempts: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(ip);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetInMs: windowMs };
  }

  bucket.count += 1;
  const remaining = Math.max(0, maxAttempts - bucket.count);
  const resetInMs = Math.max(0, bucket.resetAt - now);

  return {
    allowed: bucket.count <= maxAttempts,
    remaining,
    resetInMs,
  };
}

// Convenience presets.
export const LOGIN_RATE_LIMIT = { maxAttempts: 5, windowMs: 60_000 }; // 5 / minute / IP
export const HEARTBEAT_RATE_LIMIT = { maxAttempts: 120, windowMs: 60_000 }; // 2 / sec / IP
