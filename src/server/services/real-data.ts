import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/errors";
import type { Task, UserSettings } from "@/types/contracts";
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
