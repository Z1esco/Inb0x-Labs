import { failure, ok } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { requireCurrentUser } from "@/server/auth/current-user";
import { getPersistedThread } from "@/server/gmail/service";
import { getDemoThread } from "@/server/services/demo-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { threadId } = await context.params;
    if (!threadId || threadId.length > 200)
      throw new AppError(
        "INVALID_REQUEST",
        "The thread identifier is invalid.",
        400,
      );
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
    return ok(await getPersistedThread(user.id, threadId));
  } catch (error) {
    return failure(error);
  }
}
