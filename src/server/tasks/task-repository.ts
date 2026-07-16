import { AppError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  CreateTaskRequest,
  TaskFilters,
  TaskPriority,
  TaskSource,
  UpdateTaskRequest,
} from "@/types/contracts";

const TASK_SELECT =
  "id,email_thread_id,email_analysis_id,source_message_id,source_evidence,title,description,source,status,priority,due_at,completed_at,created_at,updated_at,email_threads(subject)";

export interface StoredAnalysisActionRow {
  id: string;
  emailThreadId: string;
  threadSubject: string;
  priority: TaskPriority;
  actionItems: unknown;
}

interface CursorPayload {
  offset: number;
  sort: TaskFilters["sort"];
}

export function decodeTaskCursor(
  cursor: string | undefined,
  sort: TaskFilters["sort"],
): number {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as Partial<CursorPayload>;
    if (
      !Number.isSafeInteger(parsed.offset) ||
      Number(parsed.offset) < 0 ||
      parsed.sort !== sort
    )
      throw new Error("invalid cursor");
    return Number(parsed.offset);
  } catch {
    throw new AppError("INVALID_REQUEST", "The task cursor is invalid.", 400);
  }
}

export function encodeTaskCursor(
  offset: number,
  sort: TaskFilters["sort"],
): string {
  return Buffer.from(JSON.stringify({ offset, sort }), "utf8").toString(
    "base64url",
  );
}

export async function listTaskRows(userId: string, filters: TaskFilters) {
  const offset = decodeTaskCursor(filters.cursor, filters.sort);
  const database = await createSupabaseServerClient();
  let query = database
    .from("tasks")
    .select(TASK_SELECT, { count: "exact" })
    .eq("user_id", userId);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.priority) query = query.eq("priority", filters.priority);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.threadId) query = query.eq("email_thread_id", filters.threadId);
  if (filters.dueBefore) query = query.lte("due_at", filters.dueBefore);
  if (filters.dueAfter) query = query.gte("due_at", filters.dueAfter);
  if (filters.sort === "due_asc")
    query = query
      .order("due_at", { ascending: true, nullsFirst: false })
      .order("id", { ascending: true });
  else if (filters.sort === "due_desc")
    query = query
      .order("due_at", { ascending: false, nullsFirst: false })
      .order("id", { ascending: true });
  else if (filters.sort === "created_asc")
    query = query
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
  else if (filters.sort === "priority_desc")
    query = query
      .order("priority_rank", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
  else
    query = query
      .order("created_at", { ascending: false })
      .order("id", { ascending: true });
  const { data, error, count } = await query.range(
    offset,
    offset + filters.limit - 1,
  );
  if (error)
    throw new AppError("INTERNAL_ERROR", "Tasks could not be loaded.", 500);
  const total = count ?? 0;
  return {
    rows: (data ?? []) as unknown as Record<string, unknown>[],
    total,
    nextCursor:
      offset + (data?.length ?? 0) < total
        ? encodeTaskCursor(offset + (data?.length ?? 0), filters.sort)
        : null,
  };
}

export async function getTaskRow(userId: string, taskId: string) {
  const { data, error } = await (
    await createSupabaseServerClient()
  )
    .from("tasks")
    .select(TASK_SELECT)
    .eq("user_id", userId)
    .eq("id", taskId)
    .maybeSingle();
  if (error)
    throw new AppError("INTERNAL_ERROR", "The task could not be loaded.", 500);
  return data as unknown as Record<string, unknown> | null;
}

export async function insertManualTaskRow(
  userId: string,
  input: CreateTaskRequest,
) {
  const { data, error } = await createSupabaseAdminClient()
    .from("tasks")
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      source: "manual",
      status: "open",
      priority: input.priority ?? "medium",
      due_at: input.dueAt ?? null,
      completed_at: null,
    })
    .select(TASK_SELECT)
    .single();
  if (error || !data)
    throw new AppError("INTERNAL_ERROR", "The task could not be created.", 500);
  return data as unknown as Record<string, unknown>;
}

export async function getOwnedAnalysisActionRow(
  userId: string,
  analysisId: string,
): Promise<StoredAnalysisActionRow | null> {
  const { data, error } = await (
    await createSupabaseServerClient()
  )
    .from("email_analyses")
    .select(
      "id,email_thread_id,priority_level,action_items,email_threads!inner(id,user_id,subject)",
    )
    .eq("id", analysisId)
    .eq("user_id", userId)
    .eq("email_threads.user_id", userId)
    .maybeSingle();
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "The source analysis could not be loaded.",
      500,
    );
  if (!data) return null;
  const thread = Array.isArray(data.email_threads)
    ? data.email_threads[0]
    : data.email_threads;
  if (!thread) return null;
  return {
    id: String(data.id),
    emailThreadId: String(data.email_thread_id),
    threadSubject: String(thread.subject),
    priority: data.priority_level as TaskPriority,
    actionItems: data.action_items,
  };
}

export async function insertDerivedTaskRow(input: {
  userId: string;
  emailThreadId: string;
  emailAnalysisId: string;
  sourceMessageId: string;
  sourceActionKey: string;
  sourceEvidence: string;
  title: string;
  description: string | null;
  source: Exclude<TaskSource, "manual">;
  priority: TaskPriority;
  dueAt: string | null;
}) {
  const database = createSupabaseAdminClient();
  const { data, error } = await database
    .from("tasks")
    .upsert(
      {
        user_id: input.userId,
        email_thread_id: input.emailThreadId,
        email_analysis_id: input.emailAnalysisId,
        source_message_id: input.sourceMessageId,
        source_action_key: input.sourceActionKey,
        source_evidence: input.sourceEvidence,
        title: input.title,
        description: input.description,
        source: input.source,
        status: "open",
        priority: input.priority,
        due_at: input.dueAt,
        completed_at: null,
      },
      {
        onConflict: "user_id,source_action_key",
        ignoreDuplicates: true,
      },
    )
    .select(TASK_SELECT)
    .maybeSingle();
  if (error)
    throw new AppError("INTERNAL_ERROR", "The task could not be created.", 500);
  if (data)
    return { row: data as unknown as Record<string, unknown>, created: true };
  const { data: existing, error: existingError } = await database
    .from("tasks")
    .select(TASK_SELECT)
    .eq("user_id", input.userId)
    .eq("source_action_key", input.sourceActionKey)
    .single();
  if (existingError || !existing)
    throw new AppError("INTERNAL_ERROR", "The task could not be loaded.", 500);
  return {
    row: existing as unknown as Record<string, unknown>,
    created: false,
  };
}

export async function updateTaskRow(
  userId: string,
  taskId: string,
  patch: UpdateTaskRequest,
  existingCompletedAt: string | null,
) {
  const values = {
    ...(patch.title !== undefined && { title: patch.title }),
    ...(patch.description !== undefined && { description: patch.description }),
    ...(patch.priority !== undefined && { priority: patch.priority }),
    ...(patch.dueAt !== undefined && { due_at: patch.dueAt }),
    ...(patch.status !== undefined && {
      status: patch.status,
      completed_at:
        patch.status === "completed"
          ? (existingCompletedAt ?? new Date().toISOString())
          : null,
    }),
  };
  const { data, error } = await createSupabaseAdminClient()
    .from("tasks")
    .update(values)
    .eq("user_id", userId)
    .eq("id", taskId)
    .select(TASK_SELECT)
    .maybeSingle();
  if (error)
    throw new AppError("INTERNAL_ERROR", "The task could not be updated.", 500);
  return data as unknown as Record<string, unknown> | null;
}

export async function deleteTaskRow(
  userId: string,
  taskId: string,
): Promise<boolean> {
  const { data, error } = await createSupabaseAdminClient()
    .from("tasks")
    .delete()
    .eq("user_id", userId)
    .eq("id", taskId)
    .select("id");
  if (error)
    throw new AppError("INTERNAL_ERROR", "The task could not be deleted.", 500);
  return Boolean(data?.length);
}
