import { failure, ok } from "@/lib/api-response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { settingsInputSchema } from "@/schemas/api";
import { requireCurrentUser } from "@/server/auth/current-user";
import {
  getDemoSettings,
  updateDemoSettings,
} from "@/server/services/demo-store";
import { getRealSettings } from "@/server/services/real-data";
export async function GET() {
  try {
    const user = await requireCurrentUser();
    return ok(user.demo ? getDemoSettings() : await getRealSettings(user.id), {
      demo: user.demo,
    });
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request) {
  try {
    const user = await requireCurrentUser();
    const input = settingsInputSchema.parse(await request.json());
    if (user.demo) return ok(updateDemoSettings(input), { demo: true });
    const mapped = {
      ...(input.dailyAnalysisLimit !== undefined && {
        daily_analysis_limit: input.dailyAnalysisLimit,
      }),
      ...(input.gmailLookbackDays !== undefined && {
        gmail_lookback_days: input.gmailLookbackDays,
      }),
      ...(input.gmailMaxThreads !== undefined && {
        gmail_max_threads: input.gmailMaxThreads,
      }),
      ...(input.dataRetentionHours !== undefined && {
        data_retention_hours: input.dataRetentionHours,
      }),
      ...(input.preferredTone !== undefined && {
        preferred_tone: input.preferredTone,
      }),
      ...(input.preferredReplyLength !== undefined && {
        preferred_reply_length: input.preferredReplyLength,
      }),
    };
    const { error } = await createSupabaseAdminClient()
      .from("user_settings")
      .update(mapped)
      .eq("user_id", user.id);
    if (error) throw error;
    return ok(await getRealSettings(user.id));
  } catch (error) {
    return failure(error);
  }
}
