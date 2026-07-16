import { z } from "zod";
import type { DashboardData } from "@/types/contracts";

export function isValidTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export const dashboardQuerySchema = z.strictObject({
  timezone: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .refine(isValidTimezone, "Invalid timezone")
    .default("UTC"),
});

const count = z.number().int().nonnegative();
const dateTime = z.string().datetime({ offset: true });
const nullableDateTime = dateTime.nullable();
const usage = z.strictObject({ used: count, limit: count, remaining: count });
const taskItem = z.strictObject({
  id: z.string(),
  title: z.string(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  dueAt: nullableDateTime,
  completedAt: nullableDateTime,
});
const trend = z.strictObject({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count,
});

export const dashboardResponseSchema: z.ZodType<DashboardData> = z.strictObject(
  {
    generatedAt: dateTime,
    timezone: z.string(),
    demoMode: z.boolean(),
    gmail: z.strictObject({
      connected: z.boolean(),
      gmailAddress: z.string().nullable(),
      lastSyncedAt: nullableDateTime,
      requiresReauthorization: z.boolean(),
      readOnly: z.literal(true),
    }),
    overview: z.strictObject({
      threads: count,
      analyzedThreads: count,
      criticalThreads: count,
      highPriorityThreads: count,
      needsReply: count,
      openTasks: count,
      completedTasks: count,
      overdueTasks: count,
      drafts: count,
      deadlines: count,
      meetings: count,
    }),
    inboxHealth: z.strictObject({
      score: z.number().int().min(0).max(100),
      label: z.enum([
        "excellent",
        "good",
        "attention",
        "overloaded",
        "insufficient_data",
      ]),
      factors: z
        .array(
          z.strictObject({
            key: z.string(),
            label: z.string(),
            value: z.number(),
            impact: z.enum(["positive", "neutral", "negative"]),
          }),
        )
        .max(20),
    }),
    today: z.strictObject({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      items: z
        .array(
          z.strictObject({
            id: z.string(),
            type: z.enum(["task", "deadline", "meeting", "thread", "draft"]),
            title: z.string(),
            at: nullableDateTime,
            urgency: z.number(),
            threadId: z.string().nullable(),
            taskId: z.string().nullable(),
            draftId: z.string().nullable(),
          }),
        )
        .max(12),
    }),
    priorityThreads: z
      .array(
        z.strictObject({
          threadId: z.string(),
          subject: z.string(),
          sender: z.string().nullable(),
          snippet: z.string().max(300),
          priority: z.enum(["critical", "high", "medium", "low"]),
          score: z.number().min(0).max(100),
          needsReply: z.boolean(),
          latestMessageAt: dateTime,
          nearestDeadline: nullableDateTime,
        }),
      )
      .max(10),
    tasks: z.strictObject({
      open: count,
      completed: count,
      overdue: count,
      dueToday: count,
      upcoming: z.array(taskItem).max(8),
      recentCompletions: z.array(taskItem).max(5),
    }),
    replies: z.strictObject({
      totalDrafts: count,
      recentDrafts: z
        .array(
          z.strictObject({
            id: z.string(),
            threadId: z.string(),
            subject: z.string().max(200),
            tone: z.enum(["direct", "balanced", "warm", "professional"]),
            length: z.enum(["short", "medium", "detailed"]),
            createdAt: dateTime,
            warningCount: count,
            confidence: z.number().min(0).max(1),
            copyOnly: z.literal(true),
            sent: z.literal(false),
          }),
        )
        .max(5),
      pendingReplyThreads: count,
    }),
    usage: z.strictObject({ analysis: usage, replies: usage }),
    analytics: z.strictObject({
      categoryDistribution: z.array(
        z.strictObject({
          key: z.string(),
          count,
          percentage: z.number().int().min(0).max(100),
        }),
      ),
      priorityDistribution: z.array(
        z.strictObject({
          key: z.string(),
          count,
          percentage: z.number().int().min(0).max(100),
        }),
      ),
      weeklyThreads: z.array(trend).length(7),
      weeklyTasksCompleted: z.array(trend).length(7),
      weeklyDraftsCreated: z.array(trend).length(7),
      averageConfidence: z.number().min(0).max(1),
      estimatedTimeSavedMinutes: count,
    }),
    recentActivity: z
      .array(
        z.strictObject({
          id: z.string(),
          type: z.enum([
            "gmail_sync",
            "analysis",
            "task_created",
            "task_completed",
            "reply_draft",
          ]),
          title: z.string(),
          at: dateTime,
        }),
      )
      .max(15),
  },
);
