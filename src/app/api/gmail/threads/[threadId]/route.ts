import { failure, ok } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireCurrentUser } from "@/server/auth/current-user";
import { getDemoThread } from "@/server/services/demo-store";
export async function GET(
  _request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { threadId } = await context.params;
    if (user.demo) {
      const thread = getDemoThread(threadId);
      if (!thread)
        throw new AppError(
          "THREAD_NOT_FOUND",
          "The requested email thread was not found.",
          404,
        );
      return ok(thread, { demo: true });
    }
    const { data } = await createSupabaseAdminClient()
      .from("email_threads")
      .select("*")
      .eq("user_id", user.id)
      .eq("id", threadId)
      .maybeSingle();
    if (!data)
      throw new AppError(
        "THREAD_NOT_FOUND",
        "The requested email thread was not found.",
        404,
      );
    return ok(data);
  } catch (error) {
    return failure(error);
  }
}
