import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function cleanExpiredEmailText(
  userId: string,
  retentionHours: number,
): Promise<number> {
  const cutoff = new Date(
    Date.now() - retentionHours * 3_600_000,
  ).toISOString();
  const { data, error } = await createSupabaseAdminClient()
    .from("email_threads")
    .update({
      normalized_text: null,
      normalized_character_count: 0,
      messages: [],
    })
    .eq("user_id", userId)
    .lt("synced_at", cutoff)
    .not("normalized_text", "is", null)
    .select("id");
  if (error) return 0;
  return data.length;
}
