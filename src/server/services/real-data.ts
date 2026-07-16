import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/errors";
import {
  ANALYZE_THREAD_PROMPT_VERSION,
  OUTPUT_SCHEMA_VERSION,
} from "@/prompts/versions";
import { analyzeWithOpenAI } from "@/server/ai/openai-service";
import type { EmailAnalysis, Task, UserSettings } from "@/types/contracts";

export async function analyzeRealThread(
  userId: string,
  threadId: string,
  force: boolean,
): Promise<EmailAnalysis> {
  const db = createSupabaseAdminClient();
  const { data: thread } = await db
    .from("email_threads")
    .select("id, normalized_text, content_hash")
    .eq("user_id", userId)
    .eq("id", threadId)
    .maybeSingle();
  if (!thread?.normalized_text)
    throw new AppError(
      "THREAD_NOT_FOUND",
      "The requested email thread was not found.",
      404,
    );
  if (!force) {
    const { data: cached } = await db
      .from("email_analyses")
      .select("*")
      .eq("email_thread_id", thread.id)
      .eq("content_hash", thread.content_hash)
      .eq("prompt_version", ANALYZE_THREAD_PROMPT_VERSION)
      .maybeSingle();
    if (cached) return rowToAnalysis(cached);
  }
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  const { count } = await db
    .from("usage_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("event_type", "analysis")
    .gte("created_at", start.toISOString());
  const settings = await getRealSettings(userId);
  if ((count ?? 0) >= settings.dailyAnalysisLimit)
    throw new AppError(
      "ANALYSIS_LIMIT_REACHED",
      "Your daily analysis limit has been reached.",
      429,
    );
  const result = await analyzeWithOpenAI(thread.normalized_text);
  const output = result.output;
  await db.from("email_analyses").upsert(
    {
      user_id: userId,
      email_thread_id: thread.id,
      content_hash: thread.content_hash,
      prompt_version: ANALYZE_THREAD_PROMPT_VERSION,
      schema_version: OUTPUT_SCHEMA_VERSION,
      model: result.model,
      response_id: result.responseId,
      summary: output.summary,
      category: output.category,
      priority_score: output.priorityScore,
      priority_level: output.priorityLevel,
      priority_reason: output.priorityReason,
      needs_reply: output.needsReply,
      confidence: output.confidence,
      deadlines: output.deadlines,
      action_items: output.actionItems,
      meetings: output.meetings,
      evidence: output.evidence,
      safety_flags: output.safetyFlags,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
    },
    { onConflict: "email_thread_id,content_hash,prompt_version" },
  );
  await db.from("usage_events").insert({
    user_id: userId,
    event_type: "analysis",
    model: result.model,
    input_tokens: result.inputTokens,
    output_tokens: result.outputTokens,
    metadata: { promptVersion: ANALYZE_THREAD_PROMPT_VERSION },
  });
  return output;
}
function rowToAnalysis(row: Record<string, unknown>): EmailAnalysis {
  return {
    summary: String(row.summary),
    category: row.category as EmailAnalysis["category"],
    priorityScore: Number(row.priority_score),
    priorityLevel: row.priority_level as EmailAnalysis["priorityLevel"],
    priorityReason: String(row.priority_reason),
    needsReply: Boolean(row.needs_reply),
    replyReason: null,
    confidence: Number(row.confidence),
    deadlines: row.deadlines as EmailAnalysis["deadlines"],
    actionItems: row.action_items as EmailAnalysis["actionItems"],
    meetings: row.meetings as EmailAnalysis["meetings"],
    evidence: row.evidence as string[],
    safetyFlags: row.safety_flags as string[],
  };
}
export async function getRealSettings(userId: string): Promise<UserSettings> {
  const { data, error } = await createSupabaseAdminClient()
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (error)
    throw new AppError("INTERNAL_ERROR", "Settings could not be loaded.", 500);
  return {
    demoMode: false,
    dailyAnalysisLimit: data.daily_analysis_limit,
    gmailLookbackDays: data.gmail_lookback_days,
    gmailMaxThreads: data.gmail_max_threads,
    dataRetentionHours: data.data_retention_hours,
    preferredTone: data.preferred_tone,
    preferredReplyLength: data.preferred_reply_length,
  };
}
export function taskRow(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    threadId: row.email_thread_id ? String(row.email_thread_id) : null,
    title: String(row.title),
    description: row.description ? String(row.description) : null,
    source: row.source as Task["source"],
    status: row.status as Task["status"],
    priority: row.priority as Task["priority"],
    dueAt: row.due_at ? String(row.due_at) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
    createdAt: String(row.created_at),
  };
}
