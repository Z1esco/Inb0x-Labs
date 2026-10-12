import { failure, ok } from "@/lib/api-response";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { analyzeInboxInputSchema } from "@/schemas/api";
import { requireCurrentUser } from "@/server/auth/current-user";
import { analyzeRealInbox } from "@/server/ai/analysis-service";
import { enforceRateLimit } from "@/server/rate-limit/limiter";
import { getDemoThread } from "@/server/services/demo-store";
import type { BatchAnalysisResult } from "@/types/contracts";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    enforceRateLimit(user.id, "inbox-analysis", 3, 60_000);
    const input = analyzeInboxInputSchema.parse(await request.json());
    const maximum = getEnvironment().ANALYSIS_BATCH_LIMIT;
    if (input.threadIds.length > maximum)
      throw new AppError(
        "INVALID_REQUEST",
        `A maximum of ${maximum} threads can be analyzed at once.`,
        400,
      );
    if (user.demo) {
      const results = input.threadIds.map((threadId) => ({
        threadId,
        status: getDemoThread(threadId)?.analysis
          ? ("cached" as const)
          : ("failed" as const),
        errorCode: getDemoThread(threadId)?.analysis
          ? null
          : ("THREAD_NOT_FOUND" as const),
      }));
      const data: BatchAnalysisResult = {
        requested: results.length,
        analyzed: 0,
        cached: results.filter((item) => item.status === "cached").length,
        failed: results.filter((item) => item.status === "failed").length,
        skipped: 0,
        limitReached: false,
        usage: { used: 0, limit: 20, remaining: 20 },
        results,
      };
      return ok(data, { demo: true });
    }
    return ok(await analyzeRealInbox(user.id, input.threadIds, input.force));
  } catch (error) {
    return failure(error);
  }
}
