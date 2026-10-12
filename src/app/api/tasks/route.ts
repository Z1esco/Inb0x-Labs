import { failure, ok } from "@/lib/api-response";
import { createTaskSchema, taskListQuerySchema } from "@/schemas/task";
import { requireCurrentUser } from "@/server/auth/current-user";
import { enforceRateLimit } from "@/server/rate-limit/limiter";
import { createManualTask, listTasks } from "@/server/tasks/task-service";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const filters = taskListQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const result = await listTasks(user, filters);
    return ok(
      { tasks: result.tasks },
      {
        demo: user.demo,
        pagination: {
          nextCursor: result.nextCursor,
          limit: filters.limit,
          total: result.total,
        },
      },
    );
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    enforceRateLimit(user.id, "task-create", 30, 60_000);
    const input = createTaskSchema.parse(await request.json());
    return ok(await createManualTask(user, input), { demo: user.demo }, 201);
  } catch (error) {
    return failure(error);
  }
}
