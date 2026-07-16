import { z } from "zod";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { sha256 } from "@/lib/hashing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  formatThreadForAnalysis,
  type AnalysisPromptMessage,
} from "@/prompts/analyze-thread";
import {
  ANALYZE_THREAD_PROMPT_VERSION,
  OUTPUT_SCHEMA_VERSION,
} from "@/prompts/versions";
import { emailAnalysisSchema } from "@/schemas/email-analysis";
import { groundAnalysisOutput } from "@/server/ai/ground-analysis";
import { analyzeWithOpenAI } from "@/server/ai/openai-service";
import { getRealSettings } from "@/server/services/real-data";
import type {
  AnalysisUsage,
  BatchAnalysisItemResult,
  BatchAnalysisResult,
  EmailAnalysis,
  ErrorCode,
  ThreadAnalysisResult,
} from "@/types/contracts";

const ANALYSIS_CONCURRENCY = 2;

const storedMessageSchema = z.object({
  id: z.string().min(1).max(200),
  from: z.string().max(500),
  to: z.array(z.string().max(500)).max(100),
  cc: z.array(z.string().max(500)).max(100),
  sentAt: z.string().datetime({ offset: true }),
  subject: z.string().max(1_000),
  body: z.string(),
});

interface AnalysisThreadRow {
  id: string;
  subject: string;
  participants: string[];
  messages: unknown;
  normalized_text: string | null;
  content_hash: string;
  contains_potential_prompt_injection: boolean;
}

interface AnalysisCacheRow extends Record<string, unknown> {
  summary: unknown;
  category: unknown;
  priority_score: unknown;
  priority_level: unknown;
  priority_reason: unknown;
  needs_reply: unknown;
  reply_reason: unknown;
  confidence: unknown;
  deadlines: unknown;
  action_items: unknown;
  meetings: unknown;
  evidence: unknown;
  safety_flags: unknown;
}

function utcDayStart(now = new Date()): string {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  return start.toISOString();
}

function usageState(used: number, limit: number): AnalysisUsage {
  return { used, limit, remaining: Math.max(0, limit - used) };
}

function parseStoredMessages(value: unknown): AnalysisPromptMessage[] {
  const parsed = z.array(storedMessageSchema).safeParse(value);
  if (!parsed.success) return [];
  return parsed.data.map((message) => ({
    id: message.id,
    from: message.from,
    to: message.to,
    cc: message.cc,
    sentAt: message.sentAt,
    subject: message.subject,
    body: message.body,
  }));
}

function analysisFromRow(row: AnalysisCacheRow): EmailAnalysis {
  return emailAnalysisSchema.parse({
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
}

async function loadOwnedThread(
  userId: string,
  threadId: string,
): Promise<AnalysisThreadRow> {
  const { data, error } = await createSupabaseAdminClient()
    .from("email_threads")
    .select(
      "id,subject,participants,messages,normalized_text,content_hash,contains_potential_prompt_injection",
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
  return data as unknown as AnalysisThreadRow;
}

async function findCachedAnalysis(
  userId: string,
  thread: AnalysisThreadRow,
  model: string,
): Promise<EmailAnalysis | null> {
  const { data, error } = await createSupabaseAdminClient()
    .from("email_analyses")
    .select("*")
    .eq("user_id", userId)
    .eq("email_thread_id", thread.id)
    .eq("content_hash", thread.content_hash)
    .eq("prompt_version", ANALYZE_THREAD_PROMPT_VERSION)
    .eq("schema_version", OUTPUT_SCHEMA_VERSION)
    .eq("model", model)
    .maybeSingle();
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "The analysis cache could not be loaded.",
      500,
    );
  return data ? analysisFromRow(data as AnalysisCacheRow) : null;
}

async function dailyLimit(userId: string): Promise<number> {
  const environment = getEnvironment();
  const settings = await getRealSettings(userId);
  return Math.min(
    settings.dailyAnalysisLimit,
    environment.ANALYSIS_DAILY_LIMIT,
  );
}

export async function getAnalysisUsage(
  userId: string,
  limit?: number,
): Promise<AnalysisUsage> {
  const resolvedLimit = limit ?? (await dailyLimit(userId));
  const { count, error } = await createSupabaseAdminClient()
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "analysis")
    .gte("created_at", utcDayStart());
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Analysis usage could not be loaded.",
      500,
    );
  return usageState(count ?? 0, resolvedLimit);
}

async function reserveAnalysisUsage(
  userId: string,
  limit: number,
  model: string,
): Promise<{ eventId: string; usage: AnalysisUsage }> {
  const { data, error } = await createSupabaseAdminClient().rpc(
    "reserve_analysis_usage",
    {
      p_user_id: userId,
      p_daily_limit: limit,
      p_model: model,
      p_metadata: {
        promptVersion: ANALYZE_THREAD_PROMPT_VERSION,
        schemaVersion: OUTPUT_SCHEMA_VERSION,
        status: "reserved",
      },
    },
  );
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Analysis usage could not be reserved.",
      500,
    );
  const reservation = Array.isArray(data) ? data[0] : data;
  const used = Number(reservation?.used ?? limit);
  if (!reservation?.event_id)
    throw new AppError(
      "ANALYSIS_LIMIT_REACHED",
      "Your daily analysis limit has been reached.",
      429,
    );
  return {
    eventId: String(reservation.event_id),
    usage: usageState(used, limit),
  };
}

async function completeUsageEvent(
  userId: string,
  eventId: string,
  result: {
    model: string;
    inputTokens: number | null;
    outputTokens: number | null;
  },
): Promise<void> {
  const { error } = await createSupabaseAdminClient()
    .from("usage_events")
    .update({
      model: result.model,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      metadata: {
        promptVersion: ANALYZE_THREAD_PROMPT_VERSION,
        schemaVersion: OUTPUT_SCHEMA_VERSION,
        status: "completed",
      },
    })
    .eq("id", eventId)
    .eq("user_id", userId);
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Analysis usage could not be saved.",
      500,
    );
}

async function persistAnalysis(
  userId: string,
  thread: AnalysisThreadRow,
  analysis: EmailAnalysis,
  result: {
    responseId: string;
    model: string;
    inputTokens: number | null;
    outputTokens: number | null;
  },
): Promise<void> {
  const { error } = await createSupabaseAdminClient()
    .from("email_analyses")
    .upsert(
      {
        user_id: userId,
        email_thread_id: thread.id,
        content_hash: thread.content_hash,
        prompt_version: ANALYZE_THREAD_PROMPT_VERSION,
        schema_version: OUTPUT_SCHEMA_VERSION,
        model: result.model,
        response_id: result.responseId,
        summary: analysis.summary,
        category: analysis.category,
        priority_score: analysis.priorityScore,
        priority_level: analysis.priorityLevel,
        priority_reason: analysis.priorityReason,
        needs_reply: analysis.needsReply,
        reply_reason: analysis.replyReason,
        confidence: analysis.confidence,
        deadlines: analysis.deadlines,
        action_items: analysis.actionItems,
        meetings: analysis.meetings,
        evidence: analysis.evidence,
        safety_flags: analysis.safetyFlags,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
      },
      {
        onConflict:
          "email_thread_id,content_hash,prompt_version,schema_version,model",
      },
    );
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "The email analysis could not be saved.",
      500,
    );
}

export async function analyzeRealThread(
  userId: string,
  threadId: string,
  force: boolean,
  now = new Date(),
): Promise<ThreadAnalysisResult> {
  const environment = getEnvironment();
  if (!environment.OPENAI_API_KEY || !environment.OPENAI_MODEL)
    throw new AppError(
      "ANALYSIS_FAILED",
      "OpenAI analysis is not configured.",
      503,
    );
  const thread = await loadOwnedThread(userId, threadId);
  const normalizedText = thread.normalized_text?.trim() ?? "";
  const messages = parseStoredMessages(thread.messages);
  if (!normalizedText || messages.length === 0)
    throw new AppError(
      "INVALID_REQUEST",
      "This thread has no normalized content. Synchronize Gmail again.",
      400,
    );
  if (normalizedText.length > environment.THREAD_MAX_CHARACTERS)
    throw new AppError(
      "INVALID_REQUEST",
      "The normalized thread exceeds the analysis size limit.",
      400,
    );

  const limit = await dailyLimit(userId);
  if (!force) {
    const cached = await findCachedAnalysis(
      userId,
      thread,
      environment.OPENAI_MODEL,
    );
    if (cached)
      return {
        analysis: cached,
        cached: true,
        usage: await getAnalysisUsage(userId, limit),
      };
  }

  const reservation = await reserveAnalysisUsage(
    userId,
    limit,
    environment.OPENAI_MODEL,
  );
  const formattedThread = formatThreadForAnalysis({
    threadId: thread.id,
    subject: thread.subject,
    participants: thread.participants,
    currentDate: now.toISOString(),
    timezone: "UTC",
    containsPotentialPromptInjection:
      thread.contains_potential_prompt_injection,
    messages,
  });
  const modelResult = await analyzeWithOpenAI(
    formattedThread,
    sha256(userId).slice(0, 64),
  );
  const analysis = groundAnalysisOutput(
    modelResult.output,
    messages,
    thread.contains_potential_prompt_injection,
  );
  await persistAnalysis(userId, thread, analysis, modelResult);
  await completeUsageEvent(userId, reservation.eventId, modelResult);
  return { analysis, cached: false, usage: reservation.usage };
}

function safeErrorCode(error: unknown): ErrorCode {
  return error instanceof AppError ? error.code : "INTERNAL_ERROR";
}

export async function analyzeRealInbox(
  userId: string,
  threadIds: readonly string[],
  force: boolean,
): Promise<BatchAnalysisResult> {
  const uniqueIds = [...new Set(threadIds)];
  const maximum = getEnvironment().ANALYSIS_BATCH_LIMIT;
  if (uniqueIds.length > maximum)
    throw new AppError(
      "INVALID_REQUEST",
      `A maximum of ${maximum} threads can be analyzed at once.`,
      400,
    );
  const results: BatchAnalysisItemResult[] = new Array(uniqueIds.length);
  let nextIndex = 0;
  let limitReached = false;
  const worker = async () => {
    while (nextIndex < uniqueIds.length) {
      const index = nextIndex;
      nextIndex += 1;
      const threadId = uniqueIds[index];
      if (!threadId) continue;
      if (limitReached) {
        results[index] = {
          threadId,
          status: "skipped",
          errorCode: "ANALYSIS_LIMIT_REACHED",
        };
        continue;
      }
      try {
        const result = await analyzeRealThread(userId, threadId, force);
        results[index] = {
          threadId,
          status: result.cached ? "cached" : "analyzed",
          errorCode: null,
        };
      } catch (error) {
        const errorCode = safeErrorCode(error);
        if (errorCode === "ANALYSIS_LIMIT_REACHED") limitReached = true;
        results[index] = {
          threadId,
          status: errorCode === "ANALYSIS_LIMIT_REACHED" ? "skipped" : "failed",
          errorCode,
        };
      }
    }
  };
  await Promise.all(
    Array.from(
      { length: Math.min(ANALYSIS_CONCURRENCY, uniqueIds.length) },
      worker,
    ),
  );
  const completeResults = results.filter(
    (result): result is BatchAnalysisItemResult => Boolean(result),
  );
  return {
    requested: uniqueIds.length,
    analyzed: completeResults.filter((item) => item.status === "analyzed")
      .length,
    cached: completeResults.filter((item) => item.status === "cached").length,
    failed: completeResults.filter((item) => item.status === "failed").length,
    skipped: completeResults.filter((item) => item.status === "skipped").length,
    limitReached,
    usage: await getAnalysisUsage(userId),
    results: completeResults,
  };
}

export async function getCurrentAnalysis(
  userId: string,
  threadId: string,
): Promise<ThreadAnalysisResult> {
  const environment = getEnvironment();
  if (!environment.OPENAI_MODEL)
    throw new AppError(
      "ANALYSIS_FAILED",
      "OpenAI analysis is not configured.",
      503,
    );
  const thread = await loadOwnedThread(userId, threadId);
  const cached = await findCachedAnalysis(
    userId,
    thread,
    environment.OPENAI_MODEL,
  );
  if (!cached)
    throw new AppError(
      "THREAD_NOT_FOUND",
      "No current analysis exists for this thread.",
      404,
    );
  return {
    analysis: cached,
    cached: true,
    usage: await getAnalysisUsage(userId),
  };
}
