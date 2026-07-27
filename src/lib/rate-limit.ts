/**
 * A sliding-window rate limiter held in process memory.
 *
 * **Known limitation, accepted for M0.** Vercel runs the route in more than one
 * instance and recycles them freely, so this bounds abuse per instance rather
 * than globally, and the window resets on a cold start. That is enough to stop
 * a naive script hammering one connection; it is not a defence against a
 * distributed flood. Redis arrives in M1 and this becomes a shared store — the
 * interface is deliberately narrow so that swap is one file.
 *
 * `now` is injectable so the behaviour can be tested without waiting for real
 * time to pass (`src/lib/rate-limit.test.mts`).
 */

export type RateLimitResult = {
  allowed: boolean;
  /** Requests still available in the current window. */
  remaining: number;
  /** Seconds until the oldest hit falls out of the window. 0 when allowed. */
  retryAfterSeconds: number;
};

export type RateLimiterOptions = {
  /** Maximum hits allowed per key within `windowMs`. */
  limit: number;
  windowMs: number;
  now?: () => number;
};

export function createRateLimiter({ limit, windowMs, now = Date.now }: RateLimiterOptions) {
  const hits = new Map<string, number[]>();

  /**
   * Bounds memory: without this, one request per unique spoofed IP would grow
   * the map forever. Called on every check, so the cost is amortised.
   */
  function evictExpired(cutoff: number) {
    for (const [key, timestamps] of hits) {
      const live = timestamps.filter((at) => at > cutoff);
      if (live.length === 0) hits.delete(key);
      else hits.set(key, live);
    }
  }

  return {
    /** Records a hit for `key` and reports whether it is allowed. */
    check(key: string): RateLimitResult {
      const currentTime = now();
      const cutoff = currentTime - windowMs;
      evictExpired(cutoff);

      const timestamps = hits.get(key) ?? [];

      if (timestamps.length >= limit) {
        const oldest = timestamps[0];
        return {
          allowed: false,
          remaining: 0,
          // A blocked request is not recorded, so a client that keeps retrying
          // cannot push its own window forward and lock itself out for longer.
          retryAfterSeconds: Math.max(1, Math.ceil((oldest + windowMs - currentTime) / 1000)),
        };
      }

      timestamps.push(currentTime);
      hits.set(key, timestamps);

      return { allowed: true, remaining: limit - timestamps.length, retryAfterSeconds: 0 };
    },

    /** Test seam. Not called in production. */
    reset() {
      hits.clear();
    },
  };
}

export type RateLimiter = ReturnType<typeof createRateLimiter>;

/**
 * Best-effort client identity. Vercel sets `x-forwarded-for`; the first entry
 * is the client, the rest are proxies. Falls back to a constant so that a
 * missing header degrades to a shared bucket rather than to no limit at all.
 */
export function clientKey(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip")?.trim() || "unknown";
}
