import type {
  ApiError,
  ApiSuccess,
  EmailAnalysis,
  EmailThreadDetail,
  EmailThreadListItem,
  ReplyDraft,
  Task,
  UserSettings,
} from "@/types/contracts";

export class ApiClientError extends Error {
  constructor(
    public readonly code: ApiError["error"]["code"],
    message: string,
    public readonly requestId: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}
async function request<T>(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    ...(signal ? { signal } : {}),
    headers: { "content-type": "application/json", ...init.headers },
  });
  const payload = (await response.json()) as ApiSuccess<T> | ApiError;
  if (!payload.success)
    throw new ApiClientError(
      payload.error.code,
      payload.error.message,
      payload.error.requestId,
    );
  return payload.data;
}
export const apiClient = {
  listThreads: (signal?: AbortSignal) =>
    request<EmailThreadListItem[]>("/api/gmail/threads", {}, signal),
  getThread: (id: string, signal?: AbortSignal) =>
    request<EmailThreadDetail>(
      `/api/gmail/threads/${encodeURIComponent(id)}`,
      {},
      signal,
    ),
  analyzeThread: (threadId: string, force = false, signal?: AbortSignal) =>
    request<EmailAnalysis>(
      "/api/analysis/thread",
      { method: "POST", body: JSON.stringify({ threadId, force }) },
      signal,
    ),
  createDraft: (
    input: {
      threadId: string;
      tone: ReplyDraft["tone"];
      length: ReplyDraft["length"];
      instructions?: string;
    },
    signal?: AbortSignal,
  ) =>
    request<ReplyDraft>(
      "/api/replies/draft",
      { method: "POST", body: JSON.stringify(input) },
      signal,
    ),
  listTasks: (signal?: AbortSignal) =>
    request<Task[]>("/api/tasks", {}, signal),
  createTask: (
    input: {
      title: string;
      priority: Task["priority"];
      threadId?: string | null;
    },
    signal?: AbortSignal,
  ) =>
    request<Task>(
      "/api/tasks",
      { method: "POST", body: JSON.stringify(input) },
      signal,
    ),
  updateTask: (
    id: string,
    input: Partial<Pick<Task, "title" | "status" | "priority" | "dueAt">>,
    signal?: AbortSignal,
  ) =>
    request<Task>(
      `/api/tasks/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(input) },
      signal,
    ),
  getSettings: (signal?: AbortSignal) =>
    request<UserSettings>("/api/settings", {}, signal),
  updateSettings: (input: Partial<UserSettings>, signal?: AbortSignal) =>
    request<UserSettings>(
      "/api/settings",
      { method: "PATCH", body: JSON.stringify(input) },
      signal,
    ),
  resetDemo: (signal?: AbortSignal) =>
    request<{ reset: boolean }>("/api/demo/reset", { method: "POST" }, signal),
};
