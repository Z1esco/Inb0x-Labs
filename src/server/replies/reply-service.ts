import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { sha256 } from "@/lib/hashing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { formatThreadForReply } from "@/prompts/draft-reply";
import {
  DRAFT_REPLY_PROMPT_VERSION,
  REPLY_SCHEMA_VERSION,
} from "@/prompts/versions";
import { emailAnalysisSchema } from "@/schemas/email-analysis";
import { replyDraftOutputSchema } from "@/schemas/reply-draft";
import { draftWithOpenAI } from "@/server/ai/openai-service";
import type { CurrentUser } from "@/server/auth/current-user";
import {
  createDemoReply,
  deleteDemoReply,
  getDemoReply,
  listDemoReplies,
} from "@/server/replies/demo-reply-repository";
import { groundReplyOutput } from "@/server/replies/reply-grounding";
import { mapReplyRow } from "@/server/replies/reply-mapper";
import {
  deleteReplyRow,
  findReplyCache,
  getReplyRow,
  listReplyRows,
  loadCurrentReplyAnalysis,
  loadReplyThread,
  persistReply,
} from "@/server/replies/reply-repository";
import { getDemoThread } from "@/server/services/demo-store";
import type {
  CreateReplyDraftRequest,
  EmailAnalysis,
  ReplyDraftFilters,
  ReplyUsage,
} from "@/types/contracts";

function usageState(used: number, limit: number): ReplyUsage {
  return { used, limit, remaining: Math.max(0, limit - used) };
}

function utcDayStart(): string {
  const value = new Date();
  value.setUTCHours(0, 0, 0, 0);
  return value.toISOString();
}

export async function getReplyUsage(userId: string): Promise<ReplyUsage> {
  const limit = getEnvironment().REPLY_DAILY_LIMIT;
  const { count, error } = await createSupabaseAdminClient()
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "reply")
    .gte("created_at", utcDayStart());
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Reply usage could not be loaded.",
      500,
    );
  return usageState(count ?? 0, limit);
}

async function reserveReplyUsage(userId: string, model: string) {
  const limit = getEnvironment().REPLY_DAILY_LIMIT;
  const { data, error } = await createSupabaseAdminClient().rpc(
    "reserve_reply_usage",
    {
      p_user_id: userId,
      p_daily_limit: limit,
      p_model: model,
      p_metadata: {
        promptVersion: DRAFT_REPLY_PROMPT_VERSION,
        schemaVersion: REPLY_SCHEMA_VERSION,
        status: "reserved",
      },
    },
  );
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Reply usage could not be reserved.",
      500,
    );
  const reservation = Array.isArray(data) ? data[0] : data;
  if (!reservation?.event_id)
    throw new AppError(
      "REPLY_LIMIT_REACHED",
      "Your daily reply-generation limit has been reached.",
      429,
    );
  return {
    eventId: String(reservation.event_id),
    usage: usageState(Number(reservation.used), limit),
  };
}

async function completeReplyUsage(
  userId: string,
  eventId: string,
  result: {
    model: string;
    inputTokens: number | null;
    outputTokens: number | null;
  },
) {
  const { error } = await createSupabaseAdminClient()
    .from("usage_events")
    .update({
      model: result.model,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      metadata: {
        promptVersion: DRAFT_REPLY_PROMPT_VERSION,
        schemaVersion: REPLY_SCHEMA_VERSION,
        status: "completed",
      },
    })
    .eq("id", eventId)
    .eq("user_id", userId);
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Reply usage could not be saved.",
      500,
    );
}

function analysisFromRow(row: Record<string, unknown> | null): {
  id: string;
  analysis: EmailAnalysis;
} | null {
  if (!row) return null;
  const analysis = emailAnalysisSchema.safeParse({
    summary: row.summary,
    category: row.category,
    priorityScore: row.priority_score,
    priorityLevel: row.priority_level,
    priorityReason: row.priority_reason,
    needsReply: row.needs_reply,
    replyReason: row.reply_reason,
    confidence: row.confidence,
    deadlines: row.deadlines,
    actionItems: row.action_items,
    meetings: row.meetings,
    evidence: row.evidence,
    safetyFlags: row.safety_flags,
  });
  return analysis.success
    ? { id: String(row.id), analysis: analysis.data }
    : null;
}

export async function createReplyDraft(
  user: CurrentUser,
  input: CreateReplyDraftRequest,
) {
  if (user.demo) {
    const thread = getDemoThread(input.threadId);
    if (!thread)
      throw new AppError(
        "THREAD_NOT_FOUND",
        "The requested email thread was not found.",
        404,
      );
    const result = createDemoReply(thread, input);
    return {
      draft: result.draft,
      cached: result.cached,
      usage: usageState(0, getEnvironment().REPLY_DAILY_LIMIT),
    };
  }
  const environment = getEnvironment();
  const thread = await loadReplyThread(user.id, input.threadId);
  if (!thread.normalizedText.trim() || thread.messages.length === 0)
    throw new AppError(
      "THREAD_CONTENT_UNAVAILABLE",
      "This thread has no normalized content. Synchronize Gmail again.",
      400,
    );
  if (thread.normalizedText.length > environment.THREAD_MAX_CHARACTERS)
    throw new AppError(
      "INVALID_REQUEST",
      "The thread exceeds the reply size limit.",
      400,
    );
  if (!environment.OPENAI_API_KEY || !environment.OPENAI_MODEL)
    throw new AppError(
      "OPENAI_NOT_CONFIGURED",
      "Reply generation is not configured.",
      503,
    );
  const instructions = input.instructions?.trim() ?? "";
  const instructionsHash = sha256(instructions);
  const cacheIdentity = {
    userId: user.id,
    threadId: thread.id,
    contentHash: thread.contentHash,
    promptVersion: DRAFT_REPLY_PROMPT_VERSION,
    schemaVersion: REPLY_SCHEMA_VERSION,
    model: environment.OPENAI_MODEL,
    tone: input.tone,
    length: input.length,
    instructionsHash,
  };
  if (!input.force) {
    const cached = await findReplyCache(cacheIdentity);
    if (cached)
      return {
        draft: mapReplyRow(cached),
        cached: true,
        usage: await getReplyUsage(user.id),
      };
  }
  const storedAnalysis = analysisFromRow(
    await loadCurrentReplyAnalysis(user.id, thread),
  );
  const reservation = await reserveReplyUsage(
    user.id,
    environment.OPENAI_MODEL,
  );
  const formatted = formatThreadForReply({
    threadId: thread.id,
    subject: thread.subject,
    tone: input.tone,
    length: input.length,
    ...(instructions ? { instructions } : {}),
    containsPotentialPromptInjection: thread.containsPotentialPromptInjection,
    messages: thread.messages,
    analysis: storedAnalysis?.analysis ?? null,
  });
  const modelResult = await draftWithOpenAI(
    formatted,
    sha256(user.id).slice(0, 64),
  );
  const output = groundReplyOutput(modelResult.output, {
    tone: input.tone,
    length: input.length,
    threadSubject: thread.subject,
    ...(instructions ? { instructions } : {}),
    containsPotentialPromptInjection: thread.containsPotentialPromptInjection,
    messages: thread.messages,
  });
  const validOutput = replyDraftOutputSchema.parse(output);
  const row = await persistReply({
    user_id: user.id,
    email_thread_id: thread.id,
    email_analysis_id: storedAnalysis?.id ?? null,
    thread_content_hash: thread.contentHash,
    prompt_version: DRAFT_REPLY_PROMPT_VERSION,
    schema_version: REPLY_SCHEMA_VERSION,
    model: modelResult.model,
    response_id: modelResult.responseId,
    tone: input.tone,
    length: input.length,
    instructions: instructions || null,
    instructions_hash: instructionsHash,
    subject: validOutput.subject,
    body: validOutput.body,
    confidence: validOutput.confidence,
    used_facts: validOutput.usedFacts,
    uncertain_points: validOutput.uncertainPoints,
    warnings: validOutput.warnings,
    evidence: validOutput.evidence,
    input_tokens: modelResult.inputTokens,
    output_tokens: modelResult.outputTokens,
  });
  await completeReplyUsage(user.id, reservation.eventId, modelResult);
  return { draft: mapReplyRow(row), cached: false, usage: reservation.usage };
}

export async function listReplyDrafts(
  user: CurrentUser,
  filters: ReplyDraftFilters,
) {
  if (user.demo) return listDemoReplies(filters);
  const result = await listReplyRows(user.id, filters);
  return { ...result, drafts: result.rows.map(mapReplyRow) };
}

export async function getReplyDraft(user: CurrentUser, draftId: string) {
  const draft = user.demo
    ? getDemoReply(draftId)
    : ((row) => (row ? mapReplyRow(row) : null))(
        await getReplyRow(user.id, draftId),
      );
  if (!draft)
    throw new AppError(
      "REPLY_DRAFT_NOT_FOUND",
      "The requested reply draft was not found.",
      404,
    );
  return draft;
}

export async function deleteReplyDraft(user: CurrentUser, draftId: string) {
  return {
    deleted: user.demo
      ? deleteDemoReply(draftId)
      : await deleteReplyRow(user.id, draftId),
  };
}
