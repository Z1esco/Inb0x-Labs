import { failure, ok } from "@/lib/api-response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { deleteDataInputSchema } from "@/schemas/api";
import { requireCurrentUser } from "@/server/auth/current-user";
import { resetDemo } from "@/server/services/demo-store";
export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    deleteDataInputSchema.parse(await request.json());
    if (user.demo) {
      resetDemo();
      return ok({ deleted: true }, { demo: true });
    }
    const db = createSupabaseAdminClient();
    await db
      .from("usage_events")
      .insert({ user_id: user.id, event_type: "data_deleted", metadata: {} });
    for (const table of [
      "gmail_connections",
      "reply_drafts",
      "tasks",
      "email_analyses",
      "email_threads",
    ] as const) {
      const { error } = await db.from(table).delete().eq("user_id", user.id);
      if (error) throw error;
    }
    return ok({ deleted: true });
  } catch (error) {
    return failure(error);
  }
}
