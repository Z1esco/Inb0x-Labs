import { AppError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UpdateSettingsRequest } from "@/types/contracts";

export async function loadSettingsRows(userId: string) {
  const db = createSupabaseAdminClient();
  const [profile, settings] = await Promise.all([
    db
      .from("profiles")
      .select("display_name,avatar_url")
      .eq("id", userId)
      .maybeSingle(),
    db.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  if (profile.error || settings.error || !settings.data)
    throw new AppError("INTERNAL_ERROR", "Settings could not be loaded.", 500);
  return { profile: profile.data, settings: settings.data };
}

export async function updateSettingsRows(
  userId: string,
  input: UpdateSettingsRequest,
) {
  const db = createSupabaseAdminClient();
  const operations: PromiseLike<unknown>[] = [];
  if (input.displayName !== undefined)
    operations.push(
      db
        .from("profiles")
        .update({ display_name: input.displayName })
        .eq("id", userId),
    );
  const mapped = {
    ...(input.timezone !== undefined && { timezone: input.timezone }),
    ...(input.locale !== undefined && { locale: input.locale }),
    ...(input.appearance !== undefined && { appearance: input.appearance }),
    ...(input.defaultLandingPage !== undefined && {
      default_landing_page: input.defaultLandingPage,
    }),
    ...(input.compactMode !== undefined && { compact_mode: input.compactMode }),
    ...(input.showAnalytics !== undefined && {
      show_analytics: input.showAnalytics,
    }),
    ...(input.showInboxHealth !== undefined && {
      show_inbox_health: input.showInboxHealth,
    }),
    ...(input.showRecentActivity !== undefined && {
      show_recent_activity: input.showRecentActivity,
    }),
    ...(input.defaultReplyTone !== undefined && {
      preferred_tone: input.defaultReplyTone,
    }),
    ...(input.defaultReplyLength !== undefined && {
      preferred_reply_length: input.defaultReplyLength,
    }),
  };
  if (Object.keys(mapped).length)
    operations.push(
      db.from("user_settings").update(mapped).eq("user_id", userId),
    );
  const results = await Promise.all(operations);
  if (results.some((result) => Boolean((result as { error?: unknown }).error)))
    throw new AppError("INTERNAL_ERROR", "Settings could not be updated.", 500);
}

async function exportRows(
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
      "Account data could not be exported.",
      500,
    );
  return (data ?? []) as unknown as Record<string, unknown>[];
}

export async function exportAccountRows(userId: string) {
  const db = createSupabaseAdminClient();
  const [profile, settings, gmail, threads, analyses, tasks, drafts] =
    await Promise.all([
      db
        .from("profiles")
        .select("id,email,display_name,avatar_url,created_at,updated_at")
        .eq("id", userId)
        .maybeSingle(),
      db.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
      db
        .from("gmail_connections")
        .select(
          "gmail_address,granted_scopes,connected_at,last_synced_at,revoked_at",
        )
        .eq("user_id", userId)
        .maybeSingle(),
      exportRows(
        userId,
        "email_threads",
        "id,subject,participants,sender_names,message_count,latest_message_at,snippet,normalized_text,content_hash,has_attachments,gmail_labels,created_at,updated_at",
        500,
      ),
      exportRows(
        userId,
        "email_analyses",
        "id,email_thread_id,summary,category,priority_score,priority_level,priority_reason,needs_reply,reply_reason,confidence,deadlines,action_items,meetings,evidence,safety_flags,created_at,updated_at",
        500,
      ),
      exportRows(
        userId,
        "tasks",
        "id,email_thread_id,email_analysis_id,title,description,source,status,priority,due_at,completed_at,created_at,updated_at",
        500,
      ),
      exportRows(
        userId,
        "reply_drafts",
        "id,email_thread_id,email_analysis_id,tone,length,subject,body,confidence,used_facts,uncertain_points,warnings,evidence,created_at,updated_at",
        500,
      ),
    ]);
  if (profile.error || settings.error || gmail.error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Account data could not be exported.",
      500,
    );
  return {
    profile: profile.data,
    settings: settings.data,
    gmail: gmail.data,
    threads,
    analyses,
    tasks,
    drafts,
  };
}

export async function deleteAuthAccount(userId: string): Promise<void> {
  const { error } =
    await createSupabaseAdminClient().auth.admin.deleteUser(userId);
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "The account could not be deleted.",
      500,
    );
}
