import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  createTaskFromAnalysisSchema,
  createTaskSchema,
  taskListQuerySchema,
  updateTaskSchema,
} from "@/schemas/task";
import { createSourceActionKey } from "@/server/tasks/task-deduplication";
import { mapTaskRow } from "@/server/tasks/task-mapper";
import {
  decodeTaskCursor,
  encodeTaskCursor,
} from "@/server/tasks/task-repository";

describe("strict task request schemas", () => {
  it("trims manual tasks, defaults priority, and rejects ownership fields", () => {
    expect(createTaskSchema.parse({ title: "  Review contract  " })).toEqual({
      title: "Review contract",
      priority: "medium",
    });
    expect(() =>
      createTaskSchema.parse({
        title: "Fake source",
        userId: "another-user",
        source: "email_action",
        threadId: "thread-1",
      }),
    ).toThrow();
  });

  it("bounds strings and requires offset ISO dates", () => {
    expect(() => createTaskSchema.parse({ title: "x".repeat(201) })).toThrow();
    expect(() =>
      createTaskSchema.parse({
        title: "Invalid date",
        dueAt: "2026-07-20T10:00:00",
      }),
    ).toThrow();
    expect(
      createTaskSchema.parse({
        title: "Valid date",
        dueAt: "2026-07-20T10:00:00+08:00",
      }).dueAt,
    ).toBe("2026-07-20T10:00:00+08:00");
  });

  it("accepts only a UUID and bounded action index for extracted tasks", () => {
    expect(
      createTaskFromAnalysisSchema.parse({
        analysisId: "00000000-0000-4000-8000-000000000001",
        actionIndex: 0,
      }).actionIndex,
    ).toBe(0);
    expect(() =>
      createTaskFromAnalysisSchema.parse({
        analysisId: "not-an-analysis",
        actionIndex: 15,
      }),
    ).toThrow();
  });

  it("rejects empty updates and immutable source fields", () => {
    expect(() => updateTaskSchema.parse({})).toThrow();
    expect(() =>
      updateTaskSchema.parse({
        status: "completed",
        completedAt: "2026-07-20T00:00:00.000Z",
      }),
    ).toThrow();
    expect(updateTaskSchema.parse({ status: "completed" })).toEqual({
      status: "completed",
    });
  });

  it("validates filters, page bounds, and date ranges", () => {
    expect(
      taskListQuerySchema.parse({ status: "open", limit: "100" }),
    ).toMatchObject({ limit: 100, sort: "created_desc" });
    expect(() => taskListQuerySchema.parse({ limit: "101" })).toThrow();
    expect(() =>
      taskListQuerySchema.parse({
        dueAfter: "2026-07-21T00:00:00.000Z",
        dueBefore: "2026-07-20T00:00:00.000Z",
      }),
    ).toThrow();
  });
});

describe("task deduplication", () => {
  const base = {
    userId: "user-1",
    analysisId: "analysis-1",
    sourceMessageId: "message-1",
    title: "Approve   Proposal",
    description: "Review TERMS",
    dueAt: "2026-07-20T00:00:00.000Z",
    evidence: "Please approve the proposal",
  };

  it("is stable across irrelevant case and whitespace changes", () => {
    const first = createSourceActionKey(base);
    const second = createSourceActionKey({
      ...base,
      title: " approve proposal ",
      description: "review terms",
    });
    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes for a different user, analysis, action, evidence, or due date", () => {
    const original = createSourceActionKey(base);
    for (const changed of [
      { userId: "user-2" },
      { analysisId: "analysis-2" },
      { sourceMessageId: "message-2" },
      { evidence: "Different request" },
      { dueAt: null },
    ])
      expect(createSourceActionKey({ ...base, ...changed })).not.toBe(original);
  });
});

describe("task mapping and cursors", () => {
  it("returns only the safe public source projection", () => {
    const task = mapTaskRow({
      id: "task-1",
      user_id: "private-user",
      source_action_key: "private-key",
      email_thread_id: "thread-1",
      email_analysis_id: "analysis-1",
      source_message_id: "message-1",
      source_evidence: "Please approve",
      title: "Approve",
      description: null,
      source: "email_action",
      status: "open",
      priority: "high",
      due_at: null,
      completed_at: null,
      created_at: "2026-07-16T00:00:00.000Z",
      updated_at: "2026-07-16T00:00:00.000Z",
      email_threads: { subject: "Approval requested" },
    });
    expect(task.sourceEmail).toEqual({
      threadId: "thread-1",
      analysisId: "analysis-1",
      messageId: "message-1",
      evidence: "Please approve",
      threadSubject: "Approval requested",
    });
    expect(task).not.toHaveProperty("userId");
    expect(task).not.toHaveProperty("sourceActionKey");
  });

  it("binds opaque cursors to their sort order", () => {
    const cursor = encodeTaskCursor(25, "due_asc");
    expect(decodeTaskCursor(cursor, "due_asc")).toBe(25);
    expect(() => decodeTaskCursor(cursor, "created_desc")).toThrow(
      /cursor is invalid/i,
    );
  });
});

it("adds database ownership, completion, and idempotency controls", () => {
  const migration = readFileSync(
    new URL(
      "../../../supabase/migrations/20260716140053_task_management.sql",
      import.meta.url,
    ),
    "utf8",
  );
  expect(migration).toMatch(/unique \(user_id, source_action_key\)/i);
  expect(migration).toMatch(/validate_task_source_ownership/i);
  expect(migration).toMatch(/email_threads[\s\S]*user_id = new\.user_id/i);
  expect(migration).toMatch(/email_analyses[\s\S]*user_id = new\.user_id/i);
  expect(migration).toMatch(/tasks_completion_check/i);
  expect(migration).toMatch(/grant select on public\.tasks to authenticated/i);
  expect(migration).toMatch(
    /revoke insert, update, delete on public\.tasks from authenticated/i,
  );
  expect(migration).toMatch(/revoke all on public\.tasks from anon/i);
  const initialMigration = readFileSync(
    new URL(
      "../../../supabase/migrations/20260716084341_initial_schema.sql",
      import.meta.url,
    ),
    "utf8",
  );
  expect(initialMigration).toMatch(
    /alter table public\.%I enable row level security/i,
  );
  expect(initialMigration).toMatch(
    /create policy %I on public\.%I for select to authenticated using \(\(select auth\.uid\(\)\) = user_id\)/i,
  );
});
