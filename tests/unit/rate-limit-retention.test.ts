import { afterEach, expect, it } from "vitest";
import { clearRateLimits, enforceRateLimit } from "@/server/rate-limit/limiter";

afterEach(() => clearRateLimits());
it("bounds unique identities, keeps existing budgets and recovers after expiry", () => {
  for (let index = 0; index < 10000; index++)
    enforceRateLimit(`user-${index}`, "read", 2, 1000, 1000);
  expect(() => enforceRateLimit("overflow", "read", 2, 1000, 1000)).toThrow(
    /Too many requests/,
  );
  expect(() => enforceRateLimit("user-0", "read", 2, 1000, 1000)).not.toThrow();
  expect(() => enforceRateLimit("user-0", "read", 2, 1000, 1000)).toThrow();
  expect(() =>
    enforceRateLimit("recovered", "read", 2, 1000, 61001),
  ).not.toThrow();
});
