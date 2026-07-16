import { failure, ok } from "@/lib/api-response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireCurrentUser } from "@/server/auth/current-user";
export async function GET() {
  try {
    const user = await requireCurrentUser();
    if (user.demo)
      return ok(
        {
          connected: false,
          address: null,
          lastSyncedAt: null,
          scopes: [],
          readOnly: true as const,
        },
        { demo: true },
      );
    const { data } = await createSupabaseAdminClient()
      .from("gmail_connections")
      .select("gmail_address,last_synced_at,granted_scopes")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .maybeSingle();
    return ok({
      connected: Boolean(data),
      address: data?.gmail_address ?? null,
      lastSyncedAt: data?.last_synced_at ?? null,
      scopes: data?.granted_scopes ?? [],
      readOnly: true as const,
    });
  } catch (error) {
    return failure(error);
  }
}
