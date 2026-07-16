import { getEnvironment } from "@/lib/env";
import { getDemoDashboard } from "@/mock/dashboard";
import { dashboardResponseSchema } from "@/schemas/dashboard";
import {
  dateKey,
  distribution,
  estimatedTimeSaved,
  sevenDayTrend,
} from "@/server/dashboard/dashboard-analytics";
import { calculateInboxHealth } from "@/server/dashboard/dashboard-health";
import { loadDashboardRows } from "@/server/dashboard/dashboard-repository";
import type { CurrentUser } from "@/server/auth/current-user";
import type {
  DashboardActivityItem,
  DashboardData,
  DashboardFocusItem,
  DashboardPriorityThread,
  DashboardRecentDraft,
  DashboardTaskItem,
  PriorityLevel,
  ReplyLength,
  ReplyTone,
  TaskPriority,
} from "@/types/contracts";

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}
function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}
function objectArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object",
      )
    : [];
}
function number(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function dateValue(value: unknown): number {
  const result = Date.parse(text(value));
  return Number.isNaN(result) ? Number.POSITIVE_INFINITY : result;
}
function usage(used: number, limit: number) {
  return { used, limit, remaining: Math.max(0, limit - used) };
}
function priorityRank(value: string): number {
  return { critical: 4, high: 3, medium: 2, low: 1 }[value] ?? 0;
}

export async function getDashboard(
  user: CurrentUser,
  timezone: string,
  now = new Date(),
): Promise<DashboardData> {
  if (user.demo)
    return dashboardResponseSchema.parse(getDemoDashboard(timezone));
  const rows = await loadDashboardRows(user.id);
  const today = dateKey(now, timezone);
  const threadById = new Map(rows.threads.map((row) => [text(row.id), row]));
  const analysisByThread = new Map<string, Record<string, unknown>>();
  for (const analysis of [...rows.analyses].sort(
    (a, b) => dateValue(b.updated_at) - dateValue(a.updated_at),
  )) {
    const threadId = text(analysis.email_thread_id);
    const thread = threadById.get(threadId);
    if (
      thread &&
      text(analysis.content_hash) === text(thread.content_hash) &&
      !analysisByThread.has(threadId)
    )
      analysisByThread.set(threadId, analysis);
  }
  const analyses = [...analysisByThread.values()];
  const openTasks = rows.tasks.filter(
    (row) => text(row.status) !== "completed",
  );
  const completedTasks = rows.tasks.filter(
    (row) => text(row.status) === "completed",
  );
  const overdueTasks = openTasks.filter(
    (row) =>
      row.due_at && dateKey(new Date(text(row.due_at)), timezone) < today,
  );
  const dueTodayTasks = openTasks.filter(
    (row) =>
      row.due_at && dateKey(new Date(text(row.due_at)), timezone) === today,
  );
  const deadlineItems = analyses.flatMap((analysis) =>
    objectArray(analysis.deadlines),
  );
  const meetingItems = analyses.flatMap((analysis) =>
    objectArray(analysis.meetings),
  );
  const connection = rows.connection;
  const lastSyncedAt = connection
    ? text(connection.last_synced_at) || null
    : null;
  const requiresReauthorization = Boolean(connection?.revoked_at);
  const recentlySynced = Boolean(
    lastSyncedAt &&
    now.valueOf() - Date.parse(lastSyncedAt) <= 24 * 60 * 60 * 1000,
  );
  const critical = analyses.filter(
    (row) => row.priority_level === "critical",
  ).length;
  const high = analyses.filter((row) => row.priority_level === "high").length;
  const needsReply = analyses.filter((row) => row.needs_reply === true).length;

  const priorityThreads: DashboardPriorityThread[] = analyses
    .map((analysis) => {
      const thread = threadById.get(text(analysis.email_thread_id));
      if (!thread) return null;
      const deadlines = objectArray(analysis.deadlines)
        .map((item) => text(item.dateTime))
        .filter(Boolean)
        .sort();
      return {
        threadId: text(thread.id),
        subject: text(thread.subject, "(No subject)"),
        sender: stringArray(thread.sender_names)[0] ?? null,
        snippet: text(thread.snippet).slice(0, 300),
        priority: text(analysis.priority_level, "low") as PriorityLevel,
        score: number(analysis.priority_score),
        needsReply: analysis.needs_reply === true,
        latestMessageAt: text(thread.latest_message_at),
        nearestDeadline: deadlines[0] ?? null,
      };
    })
    .filter((item): item is DashboardPriorityThread => Boolean(item))
    .sort(
      (a, b) =>
        priorityRank(b.priority) - priorityRank(a.priority) ||
        b.score - a.score ||
        dateValue(a.nearestDeadline) - dateValue(b.nearestDeadline) ||
        Number(b.needsReply) - Number(a.needsReply) ||
        dateValue(b.latestMessageAt) - dateValue(a.latestMessageAt),
    )
    .slice(0, 10);

  const taskItem = (row: Record<string, unknown>): DashboardTaskItem => ({
    id: text(row.id),
    title: text(row.title),
    priority: text(row.priority, "medium") as TaskPriority,
    dueAt: text(row.due_at) || null,
    completedAt: text(row.completed_at) || null,
  });
  const recentDrafts: DashboardRecentDraft[] = [...rows.drafts]
    .sort((a, b) => dateValue(b.created_at) - dateValue(a.created_at))
    .slice(0, 5)
    .map((row) => ({
      id: text(row.id),
      threadId: text(row.email_thread_id),
      subject: text(row.subject).slice(0, 200),
      tone: text(row.tone, "balanced") as ReplyTone,
      length: text(row.length, "medium") as ReplyLength,
      createdAt: text(row.created_at),
      warningCount:
        objectArray(row.warnings).length || stringArray(row.warnings).length,
      confidence: number(row.confidence),
      copyOnly: true,
      sent: false,
    }));

  const focus: DashboardFocusItem[] = [];
  for (const row of [...overdueTasks, ...dueTodayTasks])
    focus.push({
      id: `task:${text(row.id)}`,
      type: "task",
      title: text(row.title),
      at: text(row.due_at) || null,
      urgency: overdueTasks.includes(row) ? 100 : 90,
      threadId: null,
      taskId: text(row.id),
      draftId: null,
    });
  for (const item of deadlineItems.filter(
    (item) =>
      item.dateTime &&
      dateKey(new Date(text(item.dateTime)), timezone) === today,
  ))
    focus.push({
      id: `deadline:${text(item.sourceMessageId)}:${text(item.label)}`,
      type: "deadline",
      title: text(item.label),
      at: text(item.dateTime) || null,
      urgency: 88,
      threadId: null,
      taskId: null,
      draftId: null,
    });
  for (const item of meetingItems.filter(
    (item) =>
      item.startAt && dateKey(new Date(text(item.startAt)), timezone) === today,
  ))
    focus.push({
      id: `meeting:${text(item.sourceMessageId)}:${text(item.title)}`,
      type: "meeting",
      title: text(item.title),
      at: text(item.startAt) || null,
      urgency: 80,
      threadId: null,
      taskId: null,
      draftId: null,
    });
  for (const thread of priorityThreads.filter(
    (item) => item.needsReply && priorityRank(item.priority) >= 3,
  ))
    focus.push({
      id: `thread:${thread.threadId}`,
      type: "thread",
      title: thread.subject,
      at: thread.latestMessageAt,
      urgency: 70 + priorityRank(thread.priority) * 5,
      threadId: thread.threadId,
      taskId: null,
      draftId: null,
    });
  for (const draft of recentDrafts.slice(0, 3))
    focus.push({
      id: `draft:${draft.id}`,
      type: "draft",
      title: draft.subject,
      at: draft.createdAt,
      urgency: 60,
      threadId: draft.threadId,
      taskId: null,
      draftId: draft.id,
    });
  const focusItems = [...new Map(focus.map((item) => [item.id, item])).values()]
    .sort((a, b) => b.urgency - a.urgency || dateValue(a.at) - dateValue(b.at))
    .slice(0, 12);

  const eventToday = rows.usage.filter(
    (row) => dateKey(new Date(text(row.created_at)), timezone) === today,
  );
  const analysisUsed = eventToday.filter(
    (row) => row.event_type === "analysis",
  ).length;
  const replyUsed = eventToday.filter(
    (row) => row.event_type === "reply",
  ).length;
  const analysisLimit = Math.min(
    number(rows.settings?.daily_analysis_limit) ||
      getEnvironment().ANALYSIS_DAILY_LIMIT,
    getEnvironment().ANALYSIS_DAILY_LIMIT,
  );
  const replyLimit = getEnvironment().REPLY_DAILY_LIMIT;
  const confidenceValues = analyses.map((row) => number(row.confidence));

  const activity: DashboardActivityItem[] = [
    ...rows.threads.map((row) => ({
      id: `sync:${text(row.id)}`,
      type: "gmail_sync" as const,
      title: "Email thread synchronized",
      at: text(row.synced_at),
    })),
    ...analyses.map((row) => ({
      id: `analysis:${text(row.id)}`,
      type: "analysis" as const,
      title: "Email analysis completed",
      at: text(row.created_at),
    })),
    ...rows.tasks.map((row) => ({
      id: `task:${text(row.id)}`,
      type:
        row.status === "completed"
          ? ("task_completed" as const)
          : ("task_created" as const),
      title: row.status === "completed" ? "Task completed" : "Task created",
      at: text(row.status === "completed" ? row.completed_at : row.created_at),
    })),
    ...rows.drafts.map((row) => ({
      id: `draft:${text(row.id)}`,
      type: "reply_draft" as const,
      title: "Reply draft generated",
      at: text(row.created_at),
    })),
  ]
    .filter((item) => item.at)
    .sort((a, b) => dateValue(b.at) - dateValue(a.at))
    .slice(0, 15);

  return dashboardResponseSchema.parse({
    generatedAt: now.toISOString(),
    timezone,
    demoMode: false,
    gmail: {
      connected: Boolean(connection && !connection.revoked_at),
      gmailAddress: connection ? text(connection.gmail_address) || null : null,
      lastSyncedAt,
      requiresReauthorization,
      readOnly: true,
    },
    overview: {
      threads: rows.threads.length,
      analyzedThreads: analyses.length,
      criticalThreads: critical,
      highPriorityThreads: high,
      needsReply,
      openTasks: openTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      drafts: rows.drafts.length,
      deadlines: deadlineItems.length,
      meetings: meetingItems.length,
    },
    inboxHealth: calculateInboxHealth({
      threads: rows.threads.length,
      analyzedThreads: analyses.length,
      criticalThreads: critical,
      highPriorityThreads: high,
      needsReply,
      overdueTasks: overdueTasks.length,
      dueTodayTasks: dueTodayTasks.length,
      completedTasks: completedTasks.length,
      requiresReauthorization,
      recentlySynced,
    }),
    today: { date: today, items: focusItems },
    priorityThreads,
    tasks: {
      open: openTasks.length,
      completed: completedTasks.length,
      overdue: overdueTasks.length,
      dueToday: dueTodayTasks.length,
      upcoming: openTasks
        .filter(
          (row) =>
            row.due_at &&
            dateKey(new Date(text(row.due_at)), timezone) >= today,
        )
        .sort((a, b) => dateValue(a.due_at) - dateValue(b.due_at))
        .slice(0, 8)
        .map(taskItem),
      recentCompletions: completedTasks
        .sort((a, b) => dateValue(b.completed_at) - dateValue(a.completed_at))
        .slice(0, 5)
        .map(taskItem),
    },
    replies: {
      totalDrafts: rows.drafts.length,
      recentDrafts,
      pendingReplyThreads: needsReply,
    },
    usage: {
      analysis: usage(analysisUsed, analysisLimit),
      replies: usage(replyUsed, replyLimit),
    },
    analytics: {
      categoryDistribution: distribution(
        analyses.map((row) => text(row.category)),
      ),
      priorityDistribution: distribution(
        analyses.map((row) => text(row.priority_level)),
      ),
      weeklyThreads: sevenDayTrend(
        rows.threads.map((row) => text(row.created_at)),
        now,
        timezone,
      ),
      weeklyTasksCompleted: sevenDayTrend(
        completedTasks.map((row) => text(row.completed_at)),
        now,
        timezone,
      ),
      weeklyDraftsCreated: sevenDayTrend(
        rows.drafts.map((row) => text(row.created_at)),
        now,
        timezone,
      ),
      averageConfidence: confidenceValues.length
        ? Math.round(
            (confidenceValues.reduce((sum, value) => sum + value, 0) /
              confidenceValues.length) *
              100,
          ) / 100
        : 0,
      estimatedTimeSavedMinutes: estimatedTimeSaved({
        analyses: analyses.length,
        acceptedTasks: rows.tasks.filter((row) => text(row.source) !== "manual")
          .length,
        drafts: rows.drafts.length,
      }),
    },
    recentActivity: activity,
  });
}
