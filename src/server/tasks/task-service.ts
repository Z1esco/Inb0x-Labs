import { AppError } from "@/lib/errors";
import { actionItemSchema } from "@/schemas/email-analysis";
import type { CurrentUser } from "@/server/auth/current-user";
import {
  createDemoManualTask,
  createDemoTaskFromAnalysis,
  deleteDemoTaskRecord,
  getDemoTask,
  listDemoTaskPage,
  updateDemoTaskRecord,
} from "@/server/tasks/demo-task-repository";
import { createSourceActionKey } from "@/server/tasks/task-deduplication";
import { mapTaskRow } from "@/server/tasks/task-mapper";
import {
  deleteTaskRow,
  getOwnedAnalysisActionRow,
  getTaskRow,
  insertDerivedTaskRow,
  insertManualTaskRow,
  listTaskRows,
  updateTaskRow,
} from "@/server/tasks/task-repository";
import type {
  CreateTaskFromAnalysisRequest,
  CreateTaskRequest,
  CreateTaskResult,
  Task,
  TaskFilters,
  UpdateTaskRequest,
} from "@/types/contracts";

export async function listTasks(user: CurrentUser, filters: TaskFilters) {
  if (user.demo) return listDemoTaskPage(filters);
  const result = await listTaskRows(user.id, filters);
  return {
    tasks: result.rows.map(mapTaskRow),
    total: result.total,
    nextCursor: result.nextCursor,
  };
}

export async function getTask(
  user: CurrentUser,
  taskId: string,
): Promise<Task> {
  const task = user.demo
    ? getDemoTask(taskId)
    : await getTaskRow(user.id, taskId).then((row) =>
        row ? mapTaskRow(row) : null,
      );
  if (!task)
    throw new AppError(
      "TASK_NOT_FOUND",
      "The requested task was not found.",
      404,
    );
  return task;
}

export async function createManualTask(
  user: CurrentUser,
  input: CreateTaskRequest,
): Promise<Task> {
  if (user.demo) return createDemoManualTask(input);
  return mapTaskRow(await insertManualTaskRow(user.id, input));
}

export async function createTaskFromAnalysis(
  user: CurrentUser,
  input: CreateTaskFromAnalysisRequest,
): Promise<CreateTaskResult> {
  if (user.demo) {
    const result = createDemoTaskFromAnalysis(
      user.id,
      input.analysisId,
      input.actionIndex,
    );
    if (!result)
      throw new AppError(
        "ACTION_ITEM_NOT_FOUND",
        "The selected action item was not found.",
        404,
      );
    return result;
  }
  const analysis = await getOwnedAnalysisActionRow(user.id, input.analysisId);
  if (!analysis)
    throw new AppError(
      "ANALYSIS_NOT_FOUND",
      "The requested analysis was not found.",
      404,
    );
  const action = actionItemSchema.safeParse(
    Array.isArray(analysis.actionItems)
      ? analysis.actionItems[input.actionIndex]
      : undefined,
  );
  if (!action.success)
    throw new AppError(
      "ACTION_ITEM_NOT_FOUND",
      "The selected action item was not found.",
      404,
    );
  const title = action.data.title.slice(0, 200).trim();
  const sourceActionKey = createSourceActionKey({
    userId: user.id,
    analysisId: analysis.id,
    sourceMessageId: action.data.sourceMessageId,
    title,
    description: action.data.description,
    dueAt: action.data.dueAt,
    evidence: action.data.evidence,
  });
  const result = await insertDerivedTaskRow({
    userId: user.id,
    emailThreadId: analysis.emailThreadId,
    emailAnalysisId: analysis.id,
    sourceMessageId: action.data.sourceMessageId,
    sourceActionKey,
    sourceEvidence: action.data.evidence,
    title,
    description: action.data.description,
    source: "email_action",
    priority: analysis.priority,
    dueAt: action.data.dueAt,
  });
  return {
    task: mapTaskRow(result.row),
    created: result.created,
    duplicate: !result.created,
  };
}

export async function updateTask(
  user: CurrentUser,
  taskId: string,
  patch: UpdateTaskRequest,
): Promise<Task> {
  const current = await getTask(user, taskId);
  if (user.demo) {
    const task = updateDemoTaskRecord(taskId, patch);
    if (task) return task;
  } else {
    const row = await updateTaskRow(
      user.id,
      taskId,
      patch,
      current.completedAt,
    );
    if (row) return mapTaskRow(row);
  }
  throw new AppError(
    "TASK_NOT_FOUND",
    "The requested task was not found.",
    404,
  );
}

export async function deleteTask(
  user: CurrentUser,
  taskId: string,
): Promise<{ deleted: boolean }> {
  const deleted = user.demo
    ? deleteDemoTaskRecord(taskId)
    : await deleteTaskRow(user.id, taskId);
  return { deleted };
}
