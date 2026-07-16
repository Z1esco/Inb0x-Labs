import type { NextRequest } from "next/server";
import { failure, ok } from "@/lib/api-response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireCurrentUser } from "@/server/auth/current-user";
import { listDemoThreads } from "@/server/services/demo-store";
export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const search = request.nextUrl.searchParams;
    const limit = Math.min(Math.max(Number(search.get("limit") ?? 50), 1), 100);
    const q = search.get("q") ?? undefined;
    if (user.demo)
      return ok(listDemoThreads(q).slice(0, limit), {
        demo: true,
        nextPageToken: null,
      });
    let query = createSupabaseAdminClient()
      .from("email_threads")
      .select(
        "id,gmail_thread_id,subject,participants,sender_names,message_count,latest_message_at,snippet,has_attachments",
      )
      .eq("user_id", user.id)
      .order("latest_message_at", { ascending: false })
      .limit(limit);
    if (q) query = query.ilike("subject", `%${q.replace(/[%_]/g, "")}%`);
    const { data, error } = await query;
    if (error) throw error;
    return ok(data, { nextPageToken: null });
  } catch (error) {
    return failure(error);
  }
}
