import { failure, ok } from "@/lib/api-response";
import { taskIdSchema, updateTaskSchema } from "@/schemas/task";
import { requireCurrentUser } from "@/server/auth/current-user";
import { enforceRateLimit } from "@/server/rate-limit/limiter";
import { deleteTask, getTask, updateTask } from "@/server/tasks/task-service";

interface TaskContext {
  params: Promise<{ taskId: string }>;
}

async function taskIdFrom(context: TaskContext): Promise<string> {
  return taskIdSchema.parse((await context.params).taskId);
}

export async function GET(_request: Request, context: TaskContext) {
  try {
    const user = await requireCurrentUser();
    return ok(await getTask(user, await taskIdFrom(context)), {
      demo: user.demo,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function PATCH(request: Request, context: TaskContext) {
  try {
    const user = await requireCurrentUser();
    enforceRateLimit(user.id, "task-update", 60, 60_000);
    const input = updateTaskSchema.parse(await request.json());
    return ok(await updateTask(user, await taskIdFrom(context), input), {
      demo: user.demo,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(_request: Request, context: TaskContext) {
  try {
    const user = await requireCurrentUser();
    enforceRateLimit(user.id, "task-delete", 60, 60_000);
    return ok(await deleteTask(user, await taskIdFrom(context)), {
      demo: user.demo,
    });
  } catch (error) {
    return failure(error);
  }
}
