import { failure, ok } from "@/lib/api-response";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { analyzeInboxInputSchema } from "@/schemas/api";
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
    enforceRateLimit(user.id, "inbox-analysis", 3, 60_000);
    const input = analyzeInboxInputSchema.parse(await request.json());
    if (input.threadIds.length > getEnvironment().ANALYSIS_BATCH_LIMIT)
      throw new AppError(
        "INVALID_REQUEST",
        "The requested batch is too large.",
        400,
      );
    const results = [];
    for (const id of input.threadIds) {
      if (user.demo) {
        consumeDemoAnalysis();
        const thread = getDemoThread(id);
        if (thread?.analysis)
          results.push({
            threadId: id,
            analysis: thread.analysis,
            cached: true,
          });
      } else
        results.push({
          threadId: id,
          analysis: await analyzeRealThread(user.id, id, input.force),
          cached: false,
        });
    }
    return ok(results, { demo: user.demo });
  } catch (error) {
    return failure(error);
  }
}
