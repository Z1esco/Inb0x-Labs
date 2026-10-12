import type { DashboardData, InboxHealthLabel } from "@/types/contracts";

export interface HealthInput {
  threads: number;
  analyzedThreads: number;
  criticalThreads: number;
  highPriorityThreads: number;
  needsReply: number;
  overdueTasks: number;
  dueTodayTasks: number;
  completedTasks: number;
  requiresReauthorization: boolean;
  recentlySynced: boolean;
}

function label(score: number, hasData: boolean): InboxHealthLabel {
  if (!hasData) return "insufficient_data";
  if (score >= 85) return "excellent";
  if (score >= 70) return "good";
  if (score >= 45) return "attention";
  return "overloaded";
}

export function calculateInboxHealth(
  input: HealthInput,
): DashboardData["inboxHealth"] {
  const analyzedRatio = input.threads
    ? input.analyzedThreads / input.threads
    : 0;
  const adjustments = {
    critical: -Math.min(30, input.criticalThreads * 12),
    high: -Math.min(20, input.highPriorityThreads * 4),
    reply: -Math.min(15, input.needsReply * 2),
    overdue: -Math.min(20, input.overdueTasks * 5),
    dueToday: -Math.min(10, input.dueTodayTasks * 2),
    auth: input.requiresReauthorization ? -20 : 0,
    completed: Math.min(10, input.completedTasks),
    sync: input.recentlySynced ? 5 : 0,
    analyzed: Math.round(analyzedRatio * 10),
  };
  const score = Math.max(
    0,
    Math.min(
      100,
      75 + Object.values(adjustments).reduce((sum, value) => sum + value, 0),
    ),
  );
  return {
    score,
    label: label(score, input.threads > 0),
    factors: [
      {
        key: "critical",
        label: "Critical threads",
        value: input.criticalThreads,
        impact: input.criticalThreads ? "negative" : "neutral",
      },
      {
        key: "needs_reply",
        label: "Threads needing reply",
        value: input.needsReply,
        impact: input.needsReply ? "negative" : "neutral",
      },
      {
        key: "overdue",
        label: "Overdue tasks",
        value: input.overdueTasks,
        impact: input.overdueTasks ? "negative" : "neutral",
      },
      {
        key: "completed",
        label: "Completed tasks",
        value: input.completedTasks,
        impact: input.completedTasks ? "positive" : "neutral",
      },
      {
        key: "analyzed_ratio",
        label: "Analyzed-thread percentage",
        value: Math.round(analyzedRatio * 100),
        impact: analyzedRatio >= 0.75 ? "positive" : "neutral",
      },
      {
        key: "gmail_auth",
        label: "Gmail authorization healthy",
        value: input.requiresReauthorization ? 0 : 1,
        impact: input.requiresReauthorization ? "negative" : "positive",
      },
    ],
  };
}
