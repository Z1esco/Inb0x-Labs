import { AppError } from "@/lib/errors";
import { demoThreads } from "@/mock/emails";
import {
  createDemoManualTask,
  deleteDemoTaskRecord,
  listAllDemoTasks,
  resetDemoTasks,
  updateDemoTaskRecord,
} from "@/server/tasks/demo-task-repository";
import {
  createDemoReply,
  resetDemoReplies,
} from "@/server/replies/demo-reply-repository";
import type {
  DashboardSummary,
  EmailThreadDetail,
  ReplyDraft,
  UserSettings,
} from "@/types/contracts";

const defaultSettings: UserSettings = {
  demoMode: true,
  dailyAnalysisLimit: 20,
  gmailLookbackDays: 30,
  gmailMaxThreads: 50,
  dataRetentionHours: 24,
  preferredTone: "balanced",
  preferredReplyLength: "medium",
};
interface DemoState {
  settings: UserSettings;
  analysisCount: number;
}
const state: DemoState = {
  settings: { ...defaultSettings },
  analysisCount: 0,
};

export function resetDemo(): void {
  resetDemoTasks();
  resetDemoReplies();
  state.settings = { ...defaultSettings };
  state.analysisCount = 0;
}
export function listDemoThreads(query?: string): EmailThreadDetail[] {
  const normalized = query?.trim().toLowerCase();
  return demoThreads.filter(
    (thread) =>
      !normalized ||
      `${thread.subject} ${thread.snippet}`.toLowerCase().includes(normalized),
  );
}

export function listDemoThreadsPage(input: {
  limit: number;
  pageToken?: string | undefined;
  query?: string | undefined;
  category?: string | undefined;
  priority?: string | undefined;
  needsReply?: boolean | undefined;
}): { threads: EmailThreadDetail[]; nextPageToken: string | null } {
  let offset = 0;
  if (input.pageToken) {
    try {
      const decoded = Buffer.from(input.pageToken, "base64url").toString(
        "utf8",
      );
      if (!/^\d+$/.test(decoded)) throw new Error("invalid cursor");
      offset = Number(decoded);
      if (!Number.isSafeInteger(offset) || offset < 0)
        throw new Error("invalid cursor");
    } catch {
      throw new AppError("INVALID_REQUEST", "The page token is invalid.", 400);
    }
  }
  const filtered = listDemoThreads(input.query).filter(
    (thread) =>
      (!input.category || thread.analysis?.category === input.category) &&
      (!input.priority || thread.analysis?.priorityLevel === input.priority) &&
      (input.needsReply === undefined ||
        thread.analysis?.needsReply === input.needsReply),
  );
  const threads = filtered.slice(offset, offset + input.limit);
  const nextOffset = offset + threads.length;
  return {
    threads,
    nextPageToken:
      nextOffset < filtered.length
        ? Buffer.from(String(nextOffset), "utf8").toString("base64url")
        : null,
  };
}
export function getDemoThread(id: string): EmailThreadDetail | undefined {
  return demoThreads.find((thread) => thread.id === id);
}
export const listDemoTasks = listAllDemoTasks;
export const createDemoTask = createDemoManualTask;
export const updateDemoTask = updateDemoTaskRecord;
export const deleteDemoTask = deleteDemoTaskRecord;
export function getDemoSettings(): UserSettings {
  return { ...state.settings };
}
export function updateDemoSettings(patch: {
  [Key in keyof UserSettings]?: UserSettings[Key] | undefined;
}): UserSettings {
  if (patch.dailyAnalysisLimit !== undefined)
    state.settings.dailyAnalysisLimit = patch.dailyAnalysisLimit;
  if (patch.gmailLookbackDays !== undefined)
    state.settings.gmailLookbackDays = patch.gmailLookbackDays;
  if (patch.gmailMaxThreads !== undefined)
    state.settings.gmailMaxThreads = patch.gmailMaxThreads;
  if (patch.dataRetentionHours !== undefined)
    state.settings.dataRetentionHours = patch.dataRetentionHours;
  if (patch.preferredTone !== undefined)
    state.settings.preferredTone = patch.preferredTone;
  if (patch.preferredReplyLength !== undefined)
    state.settings.preferredReplyLength = patch.preferredReplyLength;
  return { ...state.settings };
}
export function consumeDemoAnalysis(): number {
  state.analysisCount += 1;
  return state.analysisCount;
}
export function getDemoAnalysisCount(): number {
  return state.analysisCount;
}
export function createDemoDraft(
  threadId: string,
  tone: ReplyDraft["tone"],
  length: ReplyDraft["length"],
): ReplyDraft {
  const thread = getDemoThread(threadId);
  if (!thread)
    throw new AppError(
      "THREAD_NOT_FOUND",
      "The requested email thread was not found.",
      404,
    );
  return createDemoReply(thread, { threadId, tone, length, force: false })
    .draft;
}
export function getDashboardSummary(): DashboardSummary {
  const tasks = listAllDemoTasks();
  const priorityEmails = demoThreads
    .filter((thread) => thread.analysis && thread.analysis.priorityScore >= 75)
    .map((thread) => ({ ...thread, analysis: thread.analysis! }));
  return {
    totalThreads: demoThreads.length,
    needsReply: demoThreads.filter((t) => t.analysis?.needsReply).length,
    urgent: demoThreads.filter((t) => t.analysis?.priorityLevel === "critical")
      .length,
    openTasks: tasks.filter((t) => t.status !== "completed").length,
    priorityEmails,
    insights: [
      {
        label: "Needs reply",
        value: Math.round(
          (demoThreads.filter((t) => t.analysis?.needsReply).length /
            demoThreads.length) *
            100,
        ),
        unit: "percent",
        trend: "down",
      },
      {
        label: "High priority",
        value: priorityEmails.length,
        unit: "count",
        trend: "flat",
      },
      {
        label: "Open tasks",
        value: tasks.filter((t) => t.status !== "completed").length,
        unit: "count",
        trend: "up",
      },
    ],
  };
}
