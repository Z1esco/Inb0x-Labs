import { afterEach, expect, it, vi } from "vitest";
import { formatDate, formatRelativeTime } from "@/lib/ui";

afterEach(() => vi.unstubAllEnvs());
it("renders the same absolute message timestamp across server and browser timezones", () => {
  const timestamp = "2026-07-16T23:30:00Z";
  vi.stubEnv("TZ", "UTC");
  const server = formatDate(timestamp);
  const serverCalendar = formatRelativeTime(timestamp);
  vi.stubEnv("TZ", "America/New_York");
  expect(formatDate(timestamp)).toBe(server);
  expect(formatRelativeTime(timestamp)).toBe(serverCalendar);
  expect(server).toContain("UTC");
});
