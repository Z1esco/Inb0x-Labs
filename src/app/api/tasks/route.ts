import { failure, ok } from "@/lib/api-response";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createTaskSchema } from "@/schemas/task";
import { requireCurrentUser } from "@/server/auth/current-user";
import { createDemoTask, listDemoTasks } from "@/server/services/demo-store";
import { taskRow } from "@/server/services/real-data";
export async function GET() {
  try {
    const user = await requireCurrentUser();
    if (user.demo) return ok(listDemoTasks(), { demo: true });
    const { data, error } = await createSupabaseAdminClient()
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ok(data.map(taskRow));
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const input = createTaskSchema.parse(await request.json());
    if (user.demo)
      return ok(
        createDemoTask({
          title: input.title,
          priority: input.priority,
          ...(input.threadId !== undefined && { threadId: input.threadId }),
          ...(input.description !== undefined && {
            description: input.description,
          }),
          ...(input.dueAt !== undefined && { dueAt: input.dueAt }),
        }),
        { demo: true },
        201,
      );
    const { data, error } = await createSupabaseAdminClient()
      .from("tasks")
      .insert({
        user_id: user.id,
        email_thread_id: input.threadId ?? null,
        title: input.title,
        description: input.description ?? null,
        source: input.threadId ? "email" : "manual",
        status: "open",
        priority: input.priority,
        due_at: input.dueAt ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return ok(taskRow(data), {}, 201);
  } catch (error) {
    return failure(error);
  }
}
