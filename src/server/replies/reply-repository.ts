import { z } from "zod";
import { AppError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReplyDraftFilters } from "@/types/contracts";

export const REPLY_SELECT =
  "id,email_thread_id,email_analysis_id,tone,length,subject,body,confidence,used_facts,uncertain_points,warnings,evidence,created_at,updated_at";

const storedMessageSchema = z.object({
  id: z.string().min(1).max(200),
  from: z.string().max(500),
  to: z.array(z.string().max(500)).max(100),
  cc: z.array(z.string().max(500)).max(100),
  sentAt: z.string().datetime({ offset: true }),
  subject: z.string().max(1000),
  body: z.string(),
  attachments: z
    .array(
      z.object({
        filename: z.string().max(500),
        mimeType: z.string().max(200),
        sizeBytes: z.number().int().nonnegative(),
      }),
    )
    .max(100),
});

export interface ReplyThreadRow {
  id: string;
  subject: string;
  normalizedText: string;
  contentHash: string;
  containsPotentialPromptInjection: boolean;
  messages: z.infer<typeof storedMessageSchema>[];
}

export async function loadReplyThread(
  userId: string,
  threadId: string,
): Promise<ReplyThreadRow> {
  const { data, error } = await createSupabaseAdminClient()
    .from("email_threads")
    .select(
      "id,subject,normalized_text,content_hash,contains_potential_prompt_injection,messages",
    )
    .eq("user_id", userId)
    .eq("id", threadId)
    .maybeSingle();
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "The email thread could not be loaded.",
      500,
    );
  if (!data)
    throw new AppError(
      "THREAD_NOT_FOUND",
      "The requested email thread was not found.",
      404,
    );
  const messages = z.array(storedMessageSchema).safeParse(data.messages);
  return {
    id: String(data.id),
    subject: String(data.subject),
    normalizedText:
      typeof data.normalized_text === "string" ? data.normalized_text : "",
    contentHash: String(data.content_hash),
    containsPotentialPromptInjection: Boolean(
      data.contains_potential_prompt_injection,
    ),
    messages: messages.success ? messages.data : [],
  };
}

export async function loadCurrentReplyAnalysis(
  userId: string,
  thread: ReplyThreadRow,
) {
  const { data, error } = await createSupabaseAdminClient()
    .from("email_analyses")
    .select(
      "id,summary,category,priority_score,priority_level,priority_reason,needs_reply,reply_reason,confidence,deadlines,action_items,meetings,evidence,safety_flags",
    )
    .eq("user_id", userId)
    .eq("email_thread_id", thread.id)
    .eq("content_hash", thread.contentHash)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "The thread analysis could not be loaded.",
      500,
    );
  return data as Record<string, unknown> | null;
}

export async function findReplyCache(input: {
  userId: string;
  threadId: string;
  contentHash: string;
  promptVersion: string;
  schemaVersion: string;
  model: string;
  tone: string;
  length: string;
  instructionsHash: string;
}) {
  const query = createSupabaseAdminClient()
    .from("reply_drafts")
    .select(REPLY_SELECT)
    .eq("user_id", input.userId)
    .eq("email_thread_id", input.threadId)
    .eq("thread_content_hash", input.contentHash)
    .eq("prompt_version", input.promptVersion)
    .eq("schema_version", input.schemaVersion)
    .eq("model", input.model)
    .eq("tone", input.tone)
    .eq("length", input.length)
    .eq("instructions_hash", input.instructionsHash);
  const { data, error } = await query.maybeSingle();
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "The reply cache could not be loaded.",
      500,
    );
  return data as Record<string, unknown> | null;
}

export async function persistReply(input: Record<string, unknown>) {
  const { data, error } = await createSupabaseAdminClient()
    .from("reply_drafts")
    .upsert(input, {
      onConflict:
        "user_id,email_thread_id,thread_content_hash,prompt_version,schema_version,model,tone,length,instructions_hash",
    })
    .select(REPLY_SELECT)
    .single();
  if (error || !data)
    throw new AppError(
      "INTERNAL_ERROR",
      "The reply draft could not be saved.",
      500,
    );
  return data as Record<string, unknown>;
}

function decodeCursor(cursor: string | undefined, sort: string): number {
  if (!cursor) return 0;
  try {
    const value = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as {
      offset?: unknown;
      sort?: unknown;
    };
    if (
      !Number.isSafeInteger(value.offset) ||
      Number(value.offset) < 0 ||
      value.sort !== sort
    )
      throw new Error("invalid cursor");
    return Number(value.offset);
  } catch {
    throw new AppError("INVALID_REQUEST", "The reply cursor is invalid.", 400);
  }
}

export async function listReplyRows(
  userId: string,
  filters: ReplyDraftFilters,
) {
  const offset = decodeCursor(filters.cursor, filters.sort);
  let query = (await createSupabaseServerClient())
    .from("reply_drafts")
    .select(REPLY_SELECT, { count: "exact" })
    .eq("user_id", userId);
  if (filters.threadId) query = query.eq("email_thread_id", filters.threadId);
  if (filters.tone) query = query.eq("tone", filters.tone);
  if (filters.length) query = query.eq("length", filters.length);
  if (filters.sort === "created_asc")
    query = query.order("created_at", { ascending: true });
  else if (filters.sort === "updated_desc")
    query = query.order("updated_at", { ascending: false });
  else query = query.order("created_at", { ascending: false });
  const { data, error, count } = await query
    .order("id", { ascending: true })
    .range(offset, offset + filters.limit - 1);
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Reply drafts could not be loaded.",
      500,
    );
  const total = count ?? 0;
  const nextOffset = offset + (data?.length ?? 0);
  return {
    rows: (data ?? []) as Record<string, unknown>[],
    total,
    nextCursor:
      nextOffset < total
        ? Buffer.from(
            JSON.stringify({ offset: nextOffset, sort: filters.sort }),
            "utf8",
          ).toString("base64url")
        : null,
  };
}

export async function getReplyRow(userId: string, draftId: string) {
  const { data, error } = await (
    await createSupabaseServerClient()
  )
    .from("reply_drafts")
    .select(REPLY_SELECT)
    .eq("user_id", userId)
    .eq("id", draftId)
    .maybeSingle();
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "The reply draft could not be loaded.",
      500,
    );
  return data as Record<string, unknown> | null;
}

export async function deleteReplyRow(
  userId: string,
  draftId: string,
): Promise<boolean> {
  const { data, error } = await createSupabaseAdminClient()
    .from("reply_drafts")
    .delete()
    .eq("user_id", userId)
    .eq("id", draftId)
    .select("id");
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "The reply draft could not be deleted.",
      500,
    );
  return (data?.length ?? 0) > 0;
}
