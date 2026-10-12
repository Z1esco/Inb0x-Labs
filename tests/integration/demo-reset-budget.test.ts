import { afterEach, expect, it, vi } from "vitest";
import { clearRateLimits } from "@/server/rate-limit/limiter";
import { POST } from "@/app/api/demo/reset/route";

afterEach(() => {
  clearRateLimits();
  vi.unstubAllEnvs();
});
it("cannot erase its own rate limit by resetting fictional fixtures", async () => {
  vi.stubEnv("DEMO_MODE", "true");
  clearRateLimits();
  for (let index = 0; index < 30; index++)
    expect((await POST()).status).toBe(200);
  expect((await POST()).status).toBe(429);
});
