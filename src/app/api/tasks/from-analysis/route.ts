import { failure, ok } from "@/lib/api-response";
import { createTaskFromAnalysisSchema } from "@/schemas/task";
import { requireCurrentUser } from "@/server/auth/current-user";
import { enforceRateLimit } from "@/server/rate-limit/limiter";
import { createTaskFromAnalysis } from "@/server/tasks/task-service";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    enforceRateLimit(user.id, "task-from-analysis", 30, 60_000);
    const input = createTaskFromAnalysisSchema.parse(await request.json());
    const result = await createTaskFromAnalysis(user, input);
    return ok(
      result,
      {
        demo: user.demo,
        created: result.created,
        duplicate: result.duplicate,
      },
      result.created ? 201 : 200,
    );
  } catch (error) {
    return failure(error);
  }
}
