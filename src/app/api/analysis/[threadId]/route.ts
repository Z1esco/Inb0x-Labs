import { failure, ok } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { requireCurrentUser } from "@/server/auth/current-user";
import { getCurrentAnalysis } from "@/server/ai/analysis-service";
import { getDemoThread } from "@/server/services/demo-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ threadId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const params = await context.params;
    const threadId = params.threadId.trim();
    if (!threadId || threadId.length > 200)
      throw new AppError(
        "INVALID_REQUEST",
        "The thread identifier is invalid.",
        400,
      );
    if (user.demo) {
      const analysis = getDemoThread(threadId)?.analysis;
      if (!analysis)
        throw new AppError(
          "THREAD_NOT_FOUND",
          "No current analysis exists for this thread.",
          404,
        );
      return ok(analysis, {
        demo: true,
        cached: true,
        usage: { used: 0, limit: 20, remaining: 20 },
      });
    }
    const result = await getCurrentAnalysis(user.id, threadId);
    return ok(result.analysis, {
      cached: true,
      usage: result.usage,
    });
  } catch (error) {
    return failure(error);
  }
}
