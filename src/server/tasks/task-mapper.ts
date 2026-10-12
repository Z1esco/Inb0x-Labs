import { AppError } from "@/lib/errors";
import type {
  Task,
  TaskPriority,
  TaskSource,
  TaskStatus,
} from "@/types/contracts";

const taskSources = new Set<TaskSource>([
  "manual",
  "email_action",
  "email_deadline",
  "email_meeting",
]);
const taskStatuses = new Set<TaskStatus>(["open", "in_progress", "completed"]);
const taskPriorities = new Set<TaskPriority>([
  "critical",
  "high",
  "medium",
  "low",
]);

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function sourceThreadSubject(value: unknown): string | null {
  const row = Array.isArray(value) ? value[0] : value;
  if (!row || typeof row !== "object") return null;
  return nullableString((row as Record<string, unknown>).subject);
}

export function mapTaskRow(row: Record<string, unknown>): Task {
  const source = row.source as TaskSource;
  const status = row.status as TaskStatus;
  const priority = row.priority as TaskPriority;
  if (
    !taskSources.has(source) ||
    !taskStatuses.has(status) ||
    !taskPriorities.has(priority)
  )
    throw new AppError("INTERNAL_ERROR", "Stored task data is invalid.", 500);
  const threadId = nullableString(row.email_thread_id);
  const analysisId = nullableString(row.email_analysis_id);
  const messageId = nullableString(row.source_message_id);
  const evidence = nullableString(row.source_evidence);
  return {
    id: String(row.id),
    threadId,
    analysisId,
    title: String(row.title),
    description: nullableString(row.description),
    source,
    status,
    priority,
    dueAt: nullableString(row.due_at),
    completedAt: nullableString(row.completed_at),
    sourceEmail:
      source !== "manual"
        ? {
            threadId,
            analysisId,
            messageId,
            evidence,
            threadSubject: sourceThreadSubject(row.email_threads),
          }
        : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
