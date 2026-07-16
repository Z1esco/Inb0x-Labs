import type {
  ApiError,
  ApiSuccess,
  AnalysisResponseMeta,
  AnalyzedThreadResult,
  CreateTaskFromAnalysisRequest,
  CreateTaskResult,
  EmailAnalysis,
  EmailThreadDetail,
  EmailThreadListItem,
  ReplyDraft,
  Task,
  CreateTaskRequest,
  TaskListResponse,
  UpdateTaskRequest,
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
  return (await requestEnvelope<T>(path, init, signal)).data;
}
async function requestEnvelope<
  T,
  M extends Record<string, unknown> = Record<string, unknown>,
>(
  path: string,
  init: RequestInit = {},
  signal?: AbortSignal,
): Promise<ApiSuccess<T, M>> {
  const response = await fetch(path, {
    ...init,
    ...(signal ? { signal } : {}),
    headers: { "content-type": "application/json", ...init.headers },
  });
  const payload = (await response.json()) as ApiSuccess<T, M> | ApiError;
  if (!payload.success)
    throw new ApiClientError(
      payload.error.code,
      payload.error.message,
      payload.error.requestId,
    );
  return payload;
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
  analyzeThreadWithMetadata: async (
    threadId: string,
    force = false,
    signal?: AbortSignal,
  ): Promise<AnalyzedThreadResult> => {
    const result = await requestEnvelope<EmailAnalysis, AnalysisResponseMeta>(
      "/api/analysis/thread",
      { method: "POST", body: JSON.stringify({ threadId, force }) },
      signal,
    );
    return { analysis: result.data, ...result.meta };
  },
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
    request<TaskListResponse>("/api/tasks", {}, signal).then(
      (result) => result.tasks,
    ),
  createTask: (input: CreateTaskRequest, signal?: AbortSignal) =>
    request<Task>(
      "/api/tasks",
      { method: "POST", body: JSON.stringify(input) },
      signal,
    ),
  createTaskFromAnalysis: (
    input: CreateTaskFromAnalysisRequest,
    signal?: AbortSignal,
  ) =>
    request<CreateTaskResult>(
      "/api/tasks/from-analysis",
      { method: "POST", body: JSON.stringify(input) },
      signal,
    ),
  getTask: (id: string, signal?: AbortSignal) =>
    request<Task>(`/api/tasks/${encodeURIComponent(id)}`, {}, signal),
  updateTask: (id: string, input: UpdateTaskRequest, signal?: AbortSignal) =>
    request<Task>(
      `/api/tasks/${encodeURIComponent(id)}`,
      { method: "PATCH", body: JSON.stringify(input) },
      signal,
    ),
  deleteTask: (id: string, signal?: AbortSignal) =>
    request<{ deleted: boolean }>(
      `/api/tasks/${encodeURIComponent(id)}`,
      { method: "DELETE" },
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
