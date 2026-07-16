import { randomUUID } from "node:crypto";
import { demoThreads } from "@/mock/emails";
import { initialDemoTasks } from "@/mock/tasks";
import type {
  DashboardSummary,
  EmailThreadDetail,
  ReplyDraft,
  Task,
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
  tasks: Task[];
  settings: UserSettings;
  analysisCount: number;
}
const state: DemoState = {
  tasks: structuredClone(initialDemoTasks),
  settings: { ...defaultSettings },
  analysisCount: 0,
};

export function resetDemo(): void {
  state.tasks = structuredClone(initialDemoTasks);
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
export function getDemoThread(id: string): EmailThreadDetail | undefined {
  return demoThreads.find((thread) => thread.id === id);
}
export function listDemoTasks(): Task[] {
  return state.tasks.map((task) => ({ ...task }));
}
export function createDemoTask(
  input: Pick<Task, "title" | "priority"> &
    Partial<Pick<Task, "threadId" | "description" | "dueAt">>,
): Task {
  const task: Task = {
    id: randomUUID(),
    threadId: input.threadId ?? null,
    title: input.title,
    description: input.description ?? null,
    source: input.threadId ? "email" : "manual",
    status: "open",
    priority: input.priority,
    dueAt: input.dueAt ?? null,
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
  state.tasks.unshift(task);
  return { ...task };
}
export function updateDemoTask(
  id: string,
  patch: { [Key in keyof Task]?: Task[Key] | undefined },
): Task | undefined {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return undefined;
  Object.assign(task, patch);
  task.completedAt =
    task.status === "completed" ? new Date().toISOString() : null;
  return { ...task };
}
export function deleteDemoTask(id: string): boolean {
  const before = state.tasks.length;
  state.tasks = state.tasks.filter((task) => task.id !== id);
  return state.tasks.length < before;
}
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
  const subject = thread?.subject ?? "Your message";
  return {
    id: randomUUID(),
    threadId,
    tone,
    length,
    subject: `Re: ${subject}`,
    body: `Hi,\n\nThank you for the update. I have reviewed the details and will follow up on the requested next step.\n\nBest,`,
    confidence: 0.86,
    uncertainPoints: [],
    warnings: [],
    isDraftOnly: true,
  };
}
export function getDashboardSummary(): DashboardSummary {
  const priorityEmails = demoThreads
    .filter((thread) => thread.analysis && thread.analysis.priorityScore >= 75)
    .map((thread) => ({ ...thread, analysis: thread.analysis! }));
  return {
    totalThreads: demoThreads.length,
    needsReply: demoThreads.filter((t) => t.analysis?.needsReply).length,
    urgent: demoThreads.filter((t) => t.analysis?.priorityLevel === "critical")
      .length,
    openTasks: state.tasks.filter((t) => t.status !== "completed").length,
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
        value: state.tasks.filter((t) => t.status !== "completed").length,
        unit: "count",
        trend: "up",
      },
    ],
  };
}
