import { demoThreads } from "@/mock/emails";
import { initialDemoTasks } from "@/mock/tasks";
import { actionItemSchema } from "@/schemas/email-analysis";
import { createSourceActionKey } from "@/server/tasks/task-deduplication";
import {
  decodeTaskCursor,
  encodeTaskCursor,
} from "@/server/tasks/task-repository";
import type {
  CreateTaskRequest,
  CreateTaskResult,
  Task,
  TaskFilters,
  UpdateTaskRequest,
} from "@/types/contracts";

interface DemoTaskRecord {
  task: Task;
  sourceActionKey: string | null;
}

let records: DemoTaskRecord[] = [];
let sequence = 0;

function cloneTask(task: Task): Task {
  return structuredClone(task);
}

function nextIdentity() {
  sequence += 1;
  return {
    id: `demo-created-${sequence}`,
    timestamp: new Date(
      Date.parse("2026-07-16T12:00:00.000Z") + sequence * 60_000,
    ).toISOString(),
  };
}

export function resetDemoTasks(): void {
  records = initialDemoTasks.map((task) => ({
    task: cloneTask(task),
    sourceActionKey: null,
  }));
  sequence = 0;
}

resetDemoTasks();

function compareTasks(sort: TaskFilters["sort"]) {
  const priorityRank: Record<Task["priority"], number> = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  return (left: Task, right: Task) => {
    if (sort === "priority_desc")
      return (
        priorityRank[right.priority] - priorityRank[left.priority] ||
        right.createdAt.localeCompare(left.createdAt)
      );
    if (sort === "created_asc")
      return left.createdAt.localeCompare(right.createdAt);
    if (sort === "created_desc")
      return right.createdAt.localeCompare(left.createdAt);
    if (left.dueAt === null && right.dueAt === null)
      return left.id.localeCompare(right.id);
    if (left.dueAt === null) return 1;
    if (right.dueAt === null) return -1;
    return sort === "due_desc"
      ? right.dueAt.localeCompare(left.dueAt)
      : left.dueAt.localeCompare(right.dueAt);
  };
}

export function listDemoTaskPage(filters: TaskFilters) {
  const offset = decodeTaskCursor(filters.cursor, filters.sort);
  const filtered = records
    .map(({ task }) => task)
    .filter(
      (task) =>
        (!filters.status || task.status === filters.status) &&
        (!filters.priority || task.priority === filters.priority) &&
        (!filters.source || task.source === filters.source) &&
        (!filters.threadId || task.threadId === filters.threadId) &&
        (!filters.dueBefore ||
          (task.dueAt !== null && task.dueAt <= filters.dueBefore)) &&
        (!filters.dueAfter ||
          (task.dueAt !== null && task.dueAt >= filters.dueAfter)),
    )
    .sort(compareTasks(filters.sort));
  const tasks = filtered.slice(offset, offset + filters.limit).map(cloneTask);
  return {
    tasks,
    total: filtered.length,
    nextCursor:
      offset + tasks.length < filtered.length
        ? encodeTaskCursor(offset + tasks.length, filters.sort)
        : null,
  };
}

export function listAllDemoTasks(): Task[] {
  return records.map(({ task }) => cloneTask(task));
}

export function getDemoTask(taskId: string): Task | null {
  const task = records.find(({ task }) => task.id === taskId)?.task;
  return task ? cloneTask(task) : null;
}

export function createDemoManualTask(input: CreateTaskRequest): Task {
  const identity = nextIdentity();
  const task: Task = {
    id: identity.id,
    threadId: null,
    analysisId: null,
    title: input.title,
    description: input.description ?? null,
    source: "manual",
    status: "open",
    priority: input.priority ?? "medium",
    dueAt: input.dueAt ?? null,
    completedAt: null,
    sourceEmail: null,
    createdAt: identity.timestamp,
    updatedAt: identity.timestamp,
  };
  records.unshift({ task, sourceActionKey: null });
  return cloneTask(task);
}

export function createDemoTaskFromAnalysis(
  userId: string,
  analysisId: string,
  actionIndex: number,
): CreateTaskResult | null {
  const thread = demoThreads.find((item) => item.analysisId === analysisId);
  if (!thread?.analysis) return null;
  const parsed = actionItemSchema.safeParse(
    thread.analysis.actionItems[actionIndex],
  );
  if (!parsed.success) return null;
  const action = parsed.data;
  const sourceActionKey = createSourceActionKey({
    userId,
    analysisId,
    sourceMessageId: action.sourceMessageId,
    title: action.title,
    description: action.description,
    dueAt: action.dueAt,
    evidence: action.evidence,
  });
  const duplicate = records.find(
    (record) => record.sourceActionKey === sourceActionKey,
  );
  if (duplicate)
    return { task: cloneTask(duplicate.task), created: false, duplicate: true };
  const identity = nextIdentity();
  const task: Task = {
    id: identity.id,
    threadId: thread.id,
    analysisId,
    title: action.title.slice(0, 200).trim(),
    description: action.description,
    source: "email_action",
    status: "open",
    priority: thread.analysis.priorityLevel,
    dueAt: action.dueAt,
    completedAt: null,
    sourceEmail: {
      threadId: thread.id,
      analysisId,
      messageId: action.sourceMessageId,
      evidence: action.evidence,
      threadSubject: thread.subject,
    },
    createdAt: identity.timestamp,
    updatedAt: identity.timestamp,
  };
  records.unshift({ task, sourceActionKey });
  return { task: cloneTask(task), created: true, duplicate: false };
}

export function updateDemoTaskRecord(
  taskId: string,
  patch: UpdateTaskRequest,
): Task | null {
  const record = records.find(({ task }) => task.id === taskId);
  if (!record) return null;
  const identity = nextIdentity();
  Object.assign(record.task, patch);
  if (patch.status === "completed")
    record.task.completedAt = record.task.completedAt ?? identity.timestamp;
  else if (patch.status !== undefined) record.task.completedAt = null;
  record.task.updatedAt = identity.timestamp;
  return cloneTask(record.task);
}

export function deleteDemoTaskRecord(taskId: string): boolean {
  const before = records.length;
  records = records.filter(({ task }) => task.id !== taskId);
  return records.length < before;
}
