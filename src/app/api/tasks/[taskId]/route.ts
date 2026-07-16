import { failure, ok } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { updateTaskSchema } from "@/schemas/task";
import { requireCurrentUser } from "@/server/auth/current-user";
import { deleteDemoTask, updateDemoTask } from "@/server/services/demo-store";
import { taskRow } from "@/server/services/real-data";
export async function PATCH(
  request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { taskId } = await context.params;
    const input = updateTaskSchema.parse(await request.json());
    if (user.demo) {
      const task = updateDemoTask(taskId, input);
      if (!task)
        throw new AppError("INVALID_REQUEST", "Task was not found.", 404);
      return ok(task, { demo: true });
    }
    const mapped = {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.status !== undefined && {
        status: input.status,
        completed_at:
          input.status === "completed" ? new Date().toISOString() : null,
      }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.dueAt !== undefined && { due_at: input.dueAt }),
    };
    const { data, error } = await createSupabaseAdminClient()
      .from("tasks")
      .update(mapped)
      .eq("id", taskId)
      .eq("user_id", user.id)
      .select()
      .maybeSingle();
    if (error || !data)
      throw new AppError("INVALID_REQUEST", "Task was not found.", 404);
    return ok(taskRow(data));
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const user = await requireCurrentUser();
    const { taskId } = await context.params;
    if (user.demo) {
      if (!deleteDemoTask(taskId))
        throw new AppError("INVALID_REQUEST", "Task was not found.", 404);
      return ok({ deleted: true }, { demo: true });
    }
    const { error } = await createSupabaseAdminClient()
      .from("tasks")
      .delete()
      .eq("id", taskId)
      .eq("user_id", user.id);
    if (error) throw error;
    return ok({ deleted: true });
  } catch (error) {
    return failure(error);
  }
}
