import { describe, expect, it } from "vitest";
import {
  dashboardQuerySchema,
  dashboardResponseSchema,
  isValidTimezone,
} from "@/schemas/dashboard";
import {
  distribution,
  estimatedTimeSaved,
  sevenDayTrend,
} from "@/server/dashboard/dashboard-analytics";
import { calculateInboxHealth } from "@/server/dashboard/dashboard-health";
import { getDemoDashboard } from "@/mock/dashboard";

describe("dashboard health", () => {
  it("returns insufficient data for an empty inbox", () => {
    expect(
      calculateInboxHealth({
        threads: 0,
        analyzedThreads: 0,
        criticalThreads: 0,
        highPriorityThreads: 0,
        needsReply: 0,
        overdueTasks: 0,
        dueTodayTasks: 0,
        completedTasks: 0,
        requiresReauthorization: false,
        recentlySynced: false,
      }).label,
    ).toBe("insufficient_data");
  });
  it("clamps severe and healthy workloads to 0-100", () => {
    const bad = calculateInboxHealth({
      threads: 10,
      analyzedThreads: 0,
      criticalThreads: 20,
      highPriorityThreads: 20,
      needsReply: 20,
      overdueTasks: 20,
      dueTodayTasks: 20,
      completedTasks: 0,
      requiresReauthorization: true,
      recentlySynced: false,
    });
    const good = calculateInboxHealth({
      threads: 10,
      analyzedThreads: 10,
      criticalThreads: 0,
      highPriorityThreads: 0,
      needsReply: 0,
      overdueTasks: 0,
      dueTodayTasks: 0,
      completedTasks: 20,
      requiresReauthorization: false,
      recentlySynced: true,
    });
    expect(bad.score).toBe(0);
    expect(good.score).toBe(100);
  });
});

describe("dashboard analytics", () => {
  it("calculates deterministic percentages and avoids division by zero", () => {
    expect(distribution(["work", "work", "finance"])).toEqual([
      { key: "finance", count: 1, percentage: 33 },
      { key: "work", count: 2, percentage: 67 },
    ]);
    expect(distribution([])).toEqual([]);
  });
  it("zero-fills a seven-day timezone-aware trend", () => {
    const trend = sevenDayTrend(
      ["2026-07-16T01:00:00.000Z"],
      new Date("2026-07-16T12:00:00.000Z"),
      "UTC",
    );
    expect(trend).toHaveLength(7);
    expect(trend.at(-1)).toEqual({ date: "2026-07-16", count: 1 });
    expect(trend.slice(0, 6).every((point) => point.count === 0)).toBe(true);
  });
  it("uses the documented time-saved estimate", () => {
    expect(
      estimatedTimeSaved({ analyses: 3, acceptedTasks: 2, drafts: 4 }),
    ).toBe(20);
  });
});

describe("dashboard validation and demo", () => {
  it("validates IANA timezones and rejects unknown query fields", () => {
    expect(isValidTimezone("Asia/Kuala_Lumpur")).toBe(true);
    expect(isValidTimezone("Not/A_Zone")).toBe(false);
    expect(
      dashboardQuerySchema.safeParse({ timezone: "UTC", userId: "other" })
        .success,
    ).toBe(false);
  });
  it("returns a deterministic, bounded, copy-only demo contract", () => {
    const first = getDemoDashboard("UTC");
    const second = getDemoDashboard("UTC");
    expect(first).toEqual(second);
    expect(dashboardResponseSchema.parse(first)).toEqual(first);
    expect(first.today.items.length).toBeLessThanOrEqual(12);
    expect(first.priorityThreads.length).toBeLessThanOrEqual(10);
    expect(first.analytics.weeklyThreads).toHaveLength(7);
    expect(first.replies.recentDrafts[0]).toMatchObject({
      copyOnly: true,
      sent: false,
    });
  });
});
