import type { DashboardData } from "@/types/contracts";

export const demoDashboard: DashboardData = {
  generatedAt: "2026-07-16T09:00:00.000Z",
  timezone: "UTC",
  demoMode: true,
  gmail: {
    connected: true,
    gmailAddress: "judge@inb0x.demo",
    lastSyncedAt: "2026-07-16T08:55:00.000Z",
    requiresReauthorization: false,
    readOnly: true,
  },
  overview: {
    threads: 12,
    analyzedThreads: 12,
    criticalThreads: 2,
    highPriorityThreads: 3,
    needsReply: 6,
    openTasks: 7,
    completedTasks: 2,
    overdueTasks: 1,
    drafts: 3,
    deadlines: 3,
    meetings: 2,
  },
  inboxHealth: {
    score: 51,
    label: "attention",
    factors: [
      {
        key: "critical",
        label: "Critical threads",
        value: 2,
        impact: "negative",
      },
      {
        key: "needs_reply",
        label: "Threads needing reply",
        value: 6,
        impact: "negative",
      },
      {
        key: "completed",
        label: "Completed tasks",
        value: 2,
        impact: "positive",
      },
    ],
  },
  today: {
    date: "2026-07-16",
    items: [
      {
        id: "focus-task-1",
        type: "task",
        title: "Pay invoice before deadline",
        at: "2026-07-16T10:00:00.000Z",
        urgency: 100,
        threadId: null,
        taskId: "00000000-0000-4000-8000-000000000103",
        draftId: null,
      },
      {
        id: "focus-thread-1",
        type: "thread",
        title: "Approval needed: Aurora proposal",
        at: "2026-07-16T08:30:00.000Z",
        urgency: 85,
        threadId: "proposal-approval",
        taskId: null,
        draftId: null,
      },
    ],
  },
  priorityThreads: [
    {
      threadId: "proposal-approval",
      subject: "Approval needed: Aurora proposal",
      sender: "Morgan Lee",
      snippet: "Please approve the proposal by Friday.",
      priority: "critical",
      score: 94,
      needsReply: true,
      latestMessageAt: "2026-07-16T08:30:00.000Z",
      nearestDeadline: "2026-07-17T17:00:00.000Z",
    },
  ],
  tasks: {
    open: 7,
    completed: 2,
    overdue: 1,
    dueToday: 1,
    upcoming: [
      {
        id: "00000000-0000-4000-8000-000000000103",
        title: "Pay invoice before deadline",
        priority: "critical",
        dueAt: "2026-07-16T10:00:00.000Z",
        completedAt: null,
      },
    ],
    recentCompletions: [],
  },
  replies: {
    totalDrafts: 3,
    recentDrafts: [
      {
        id: "demo-draft-1",
        threadId: "proposal-approval",
        subject: "Re: Approval needed: Aurora proposal",
        tone: "professional",
        length: "short",
        createdAt: "2026-07-16T08:40:00.000Z",
        warningCount: 0,
        confidence: 0.9,
        copyOnly: true,
        sent: false,
      },
    ],
    pendingReplyThreads: 6,
  },
  usage: {
    analysis: { used: 12, limit: 20, remaining: 8 },
    replies: { used: 3, limit: 20, remaining: 17 },
  },
  analytics: {
    categoryDistribution: [{ key: "work", count: 5, percentage: 42 }],
    priorityDistribution: [{ key: "critical", count: 2, percentage: 17 }],
    weeklyThreads: [10, 11, 12, 13, 14, 15, 16].map((day, index) => ({
      date: `2026-07-${day}`,
      count: index % 3,
    })),
    weeklyTasksCompleted: [10, 11, 12, 13, 14, 15, 16].map((day, index) => ({
      date: `2026-07-${day}`,
      count: index === 5 ? 2 : 0,
    })),
    weeklyDraftsCreated: [10, 11, 12, 13, 14, 15, 16].map((day, index) => ({
      date: `2026-07-${day}`,
      count: index > 3 ? 1 : 0,
    })),
    averageConfidence: 0.89,
    estimatedTimeSavedMinutes: 35,
  },
  recentActivity: [
    {
      id: "activity-draft-1",
      type: "reply_draft",
      title: "Reply draft generated",
      at: "2026-07-16T08:40:00.000Z",
    },
  ],
};

export function getDemoDashboard(timezone: string): DashboardData {
  return structuredClone({ ...demoDashboard, timezone });
}
