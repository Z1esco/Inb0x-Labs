import { failure, ok } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { analyzeThreadInputSchema } from "@/schemas/api";
import { requireCurrentUser } from "@/server/auth/current-user";
import { analyzeRealThread } from "@/server/ai/analysis-service";
import { enforceRateLimit } from "@/server/rate-limit/limiter";
import { getDemoThread } from "@/server/services/demo-store";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    enforceRateLimit(user.id, "thread-analysis", 10, 60_000);
    const input = analyzeThreadInputSchema.parse(await request.json());
    if (user.demo) {
      const thread = getDemoThread(input.threadId);
      if (!thread?.analysis) {
        throw new AppError(
          "THREAD_NOT_FOUND",
          "The requested email thread was not found.",
          404,
        );
      }
      return ok(thread.analysis, {
        analysisId: thread.analysisId,
        demo: true,
        cached: true,
        usage: { used: 0, limit: 20, remaining: 20 },
      });
    }
    const result = await analyzeRealThread(
      user.id,
      input.threadId,
      input.force,
    );
    return ok(result.analysis, {
      analysisId: result.analysisId,
      cached: result.cached,
      usage: result.usage,
    });
  } catch (error) {
    return failure(error);
  }
}
