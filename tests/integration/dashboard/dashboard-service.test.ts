import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ loadDashboardRows: vi.fn() }));
vi.mock("@/server/dashboard/dashboard-repository", () => ({
  loadDashboardRows: mocks.loadDashboardRows,
}));
vi.mock("@/lib/env", () => ({
  getEnvironment: () => ({ ANALYSIS_DAILY_LIMIT: 20, REPLY_DAILY_LIMIT: 20 }),
}));

import { getDashboard } from "@/server/dashboard/dashboard-service";

const user = { id: "user-1", email: "user@example.test", demo: false };
const now = new Date("2026-07-16T12:00:00.000Z");

beforeEach(() => {
  mocks.loadDashboardRows.mockResolvedValue({
    connection: {
      gmail_address: "user@example.test",
      last_synced_at: "2026-07-16T11:00:00.000Z",
      revoked_at: null,
    },
    settings: { daily_analysis_limit: 20 },
    threads: [
      {
        id: "thread-1",
        subject: "Urgent approval",
        sender_names: ["Morgan"],
        snippet: "Please approve",
        latest_message_at: "2026-07-16T10:00:00.000Z",
        content_hash: "hash-1",
        synced_at: "2026-07-16T11:00:00.000Z",
        created_at: "2026-07-16T10:00:00.000Z",
      },
      {
        id: "thread-2",
        subject: "Stale",
        sender_names: [],
        snippet: "Old",
        latest_message_at: "2026-07-15T10:00:00.000Z",
        content_hash: "new-hash",
        synced_at: "2026-07-15T11:00:00.000Z",
        created_at: "2026-07-15T10:00:00.000Z",
      },
    ],
    analyses: [
      {
        id: "analysis-1",
        email_thread_id: "thread-1",
        content_hash: "hash-1",
        category: "work",
        priority_level: "critical",
        priority_score: 95,
        needs_reply: true,
        confidence: 0.9,
        deadlines: [
          {
            label: "Approve today",
            dateTime: "2026-07-16T17:00:00.000Z",
            sourceMessageId: "message-1",
          },
        ],
        meetings: [],
        created_at: "2026-07-16T10:05:00.000Z",
        updated_at: "2026-07-16T10:05:00.000Z",
      },
      {
        id: "stale-analysis",
        email_thread_id: "thread-2",
        content_hash: "old-hash",
        category: "work",
        priority_level: "high",
        priority_score: 80,
        needs_reply: true,
        confidence: 1,
        deadlines: [],
        meetings: [],
        created_at: "2026-07-15T10:05:00.000Z",
        updated_at: "2026-07-15T10:05:00.000Z",
      },
    ],
    tasks: [
      {
        id: "task-overdue",
        title: "Overdue task",
        source: "email_action",
        status: "open",
        priority: "high",
        due_at: "2026-07-15T09:00:00.000Z",
        completed_at: null,
        created_at: "2026-07-14T09:00:00.000Z",
      },
      {
        id: "task-done",
        title: "Done",
        source: "manual",
        status: "completed",
        priority: "low",
        due_at: null,
        completed_at: "2026-07-16T08:00:00.000Z",
        created_at: "2026-07-14T08:00:00.000Z",
      },
    ],
    drafts: [
      {
        id: "draft-1",
        email_thread_id: "thread-1",
        subject: "Re: Urgent approval",
        tone: "professional",
        length: "short",
        confidence: 0.9,
        warnings: [],
        created_at: "2026-07-16T11:30:00.000Z",
        updated_at: "2026-07-16T11:30:00.000Z",
      },
    ],
    usage: [
      {
        id: "usage-1",
        event_type: "analysis",
        created_at: "2026-07-16T10:00:00.000Z",
      },
      {
        id: "usage-2",
        event_type: "reply",
        created_at: "2026-07-16T11:00:00.000Z",
      },
    ],
  });
});

describe("dashboard aggregation", () => {
  it("uses current analyses, safe bounded projections, priority sorting, and usage", async () => {
    const result = await getDashboard(user, "UTC", now);
    expect(mocks.loadDashboardRows).toHaveBeenCalledWith("user-1");
    expect(result.overview).toMatchObject({
      threads: 2,
      analyzedThreads: 1,
      criticalThreads: 1,
      overdueTasks: 1,
      drafts: 1,
      deadlines: 1,
    });
    expect(result.priorityThreads.map((item) => item.threadId)).toEqual([
      "thread-1",
    ]);
    expect(result.today.items[0]?.type).toBe("task");
    expect(result.usage.analysis).toEqual({
      used: 1,
      limit: 20,
      remaining: 19,
    });
    expect(result.replies.recentDrafts[0]).not.toHaveProperty("body");
    expect(result.replies.recentDrafts[0]).toMatchObject({
      copyOnly: true,
      sent: false,
    });
    expect(result.analytics.weeklyThreads).toHaveLength(7);
    expect(result.analytics.estimatedTimeSavedMinutes).toBe(6);
  });
  it("handles an empty disconnected account", async () => {
    mocks.loadDashboardRows.mockResolvedValue({
      connection: null,
      settings: null,
      threads: [],
      analyses: [],
      tasks: [],
      drafts: [],
      usage: [],
    });
    const result = await getDashboard(user, "UTC", now);
    expect(result.gmail.connected).toBe(false);
    expect(result.inboxHealth.label).toBe("insufficient_data");
    expect(result.overview.threads).toBe(0);
  });
});
