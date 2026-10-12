import { AppError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface DashboardRows {
  connection: Record<string, unknown> | null;
  settings: Record<string, unknown> | null;
  threads: Record<string, unknown>[];
  analyses: Record<string, unknown>[];
  tasks: Record<string, unknown>[];
  drafts: Record<string, unknown>[];
  usage: Record<string, unknown>[];
}

async function ownedRows(
  userId: string,
  table: string,
  columns: string,
  limit: number,
) {
  const { data, error } = await createSupabaseAdminClient()
    .from(table)
    .select(columns)
    .eq("user_id", userId)
    .limit(limit);
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Dashboard data could not be loaded.",
      500,
    );
  return (data ?? []) as unknown as Record<string, unknown>[];
}

export async function loadDashboardRows(
  userId: string,
): Promise<DashboardRows> {
  const connectionPromise = createSupabaseAdminClient()
    .from("gmail_connections")
    .select("gmail_address,last_synced_at,revoked_at,connected_at")
    .eq("user_id", userId)
    .maybeSingle();
  const settingsPromise = createSupabaseAdminClient()
    .from("user_settings")
    .select("daily_analysis_limit")
    .eq("user_id", userId)
    .maybeSingle();
  const [connection, settings, threads, analyses, tasks, drafts, usage] =
    await Promise.all([
      connectionPromise,
      settingsPromise,
      ownedRows(
        userId,
        "email_threads",
        "id,subject,sender_names,snippet,latest_message_at,content_hash,synced_at,created_at",
        200,
      ),
      ownedRows(
        userId,
        "email_analyses",
        "id,email_thread_id,content_hash,category,priority_level,priority_score,needs_reply,confidence,deadlines,meetings,created_at,updated_at",
        200,
      ),
      ownedRows(
        userId,
        "tasks",
        "id,title,source,status,priority,due_at,completed_at,created_at,updated_at",
        200,
      ),
      ownedRows(
        userId,
        "reply_drafts",
        "id,email_thread_id,subject,tone,length,confidence,warnings,created_at,updated_at",
        100,
      ),
      ownedRows(userId, "usage_events", "id,event_type,created_at", 200),
    ]);
  if (connection.error || settings.error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Dashboard data could not be loaded.",
      500,
    );
  return {
    connection: connection.data as Record<string, unknown> | null,
    settings: settings.data as Record<string, unknown> | null,
    threads,
    analyses,
    tasks,
    drafts,
    usage,
  };
}
