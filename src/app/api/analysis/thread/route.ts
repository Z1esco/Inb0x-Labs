import { failure, ok } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { getEnvironment } from "@/lib/env";
import { analyzeThreadInputSchema } from "@/schemas/api";
import { requireCurrentUser } from "@/server/auth/current-user";
import { enforceRateLimit } from "@/server/rate-limit/limiter";
import {
  consumeDemoAnalysis,
  getDemoThread,
} from "@/server/services/demo-store";
import { analyzeRealThread } from "@/server/services/real-data";
export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    enforceRateLimit(user.id, "thread-analysis", 10, 60_000);
    const input = analyzeThreadInputSchema.parse(await request.json());
    if (user.demo) {
      const count = consumeDemoAnalysis();
      if (count > getEnvironment().ANALYSIS_DAILY_LIMIT)
        throw new AppError(
          "ANALYSIS_LIMIT_REACHED",
          "Your daily analysis limit has been reached.",
          429,
        );
      const thread = getDemoThread(input.threadId);
      if (!thread?.analysis)
        throw new AppError(
          "THREAD_NOT_FOUND",
          "The requested email thread was not found.",
          404,
        );
      return ok(thread.analysis, { demo: true, cached: true });
    }
    return ok(await analyzeRealThread(user.id, input.threadId, input.force));
  } catch (error) {
    return failure(error);
  }
}
