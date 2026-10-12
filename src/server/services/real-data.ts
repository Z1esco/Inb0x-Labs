import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/errors";
import type { UserSettings } from "@/types/contracts";
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
    timezone: data.timezone,
    locale: data.locale,
    appearance: data.appearance,
    defaultLandingPage: data.default_landing_page,
    compactMode: data.compact_mode,
    showAnalytics: data.show_analytics,
    showInboxHealth: data.show_inbox_health,
    showRecentActivity: data.show_recent_activity,
  };
}
