import { test } from "node:test";
import assert from "node:assert/strict";

import { clientKey, createRateLimiter } from "./rate-limit.ts";

/** A clock the test drives by hand, so no test waits for real time. */
function fakeClock(start = 1_000_000) {
  let current = start;
  return {
    now: () => current,
    advance(ms: number) {
      current += ms;
    },
  };
}

test("allows up to the limit and blocks the next request", () => {
  const clock = fakeClock();
  const limiter = createRateLimiter({ limit: 3, windowMs: 60_000, now: clock.now });

  assert.deepEqual(
    [1, 2, 3].map(() => limiter.check("1.2.3.4").allowed),
    [true, true, true],
  );
  assert.equal(limiter.check("1.2.3.4").allowed, false);
});

test("reports how long to wait", () => {
  const clock = fakeClock();
  const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, now: clock.now });

  limiter.check("1.2.3.4");
  clock.advance(20_000);

  assert.equal(limiter.check("1.2.3.4").retryAfterSeconds, 40);
});

test("a blocked request does not extend its own lockout", () => {
  const clock = fakeClock();
  const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, now: clock.now });

  limiter.check("1.2.3.4");
  clock.advance(30_000);
  limiter.check("1.2.3.4"); // blocked, and must not be recorded
  clock.advance(30_001);

  assert.equal(limiter.check("1.2.3.4").allowed, true);
});

test("the window slides rather than resetting wholesale", () => {
  const clock = fakeClock();
  const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, now: clock.now });

  limiter.check("1.2.3.4");
  clock.advance(30_000);
  limiter.check("1.2.3.4");
  assert.equal(limiter.check("1.2.3.4").allowed, false);

  clock.advance(30_001); // the first hit falls out, the second has not
  assert.equal(limiter.check("1.2.3.4").allowed, true);
  assert.equal(limiter.check("1.2.3.4").allowed, false);
});

test("one client's limit does not affect another's", () => {
  const clock = fakeClock();
  const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, now: clock.now });

  limiter.check("1.2.3.4");

  assert.equal(limiter.check("1.2.3.4").allowed, false);
  assert.equal(limiter.check("5.6.7.8").allowed, true);
});

test("expired keys are evicted so the map cannot grow without bound", () => {
  const clock = fakeClock();
  const limiter = createRateLimiter({ limit: 1, windowMs: 1_000, now: clock.now });

  for (let index = 0; index < 500; index += 1) {
    limiter.check(`10.0.0.${index}`);
    clock.advance(10);
  }

  // Everything older than the window is gone; the most recent ~100 remain.
  clock.advance(2_000);
  assert.equal(limiter.check("10.0.0.0").allowed, true);
});

test("clientKey takes the first entry of x-forwarded-for", () => {
  const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 70.41.3.18, 150.172.238.178" });

  assert.equal(clientKey(headers), "203.0.113.9");
});

test("clientKey falls back to x-real-ip, then to a shared bucket", () => {
  assert.equal(clientKey(new Headers({ "x-real-ip": "203.0.113.9" })), "203.0.113.9");
  // Never "no header, no limit" — an unidentifiable client shares one bucket.
  assert.equal(clientKey(new Headers()), "unknown");
});
