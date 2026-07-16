import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_ANALYSIS_IDS } from "@/mock/emails";
import { resetDemoTasks } from "@/server/tasks/demo-task-repository";
import {
  createManualTask,
  createTaskFromAnalysis,
  deleteTask,
  getTask,
  listTasks,
  updateTask,
} from "@/server/tasks/task-service";
import type { CurrentUser } from "@/server/auth/current-user";
import type { TaskFilters } from "@/types/contracts";

const user: CurrentUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "judge@inb0x.demo",
  demo: true,
};
const filters: TaskFilters = {
  limit: 25,
  sort: "created_desc",
};

beforeEach(resetDemoTasks);

describe("deterministic demo task management", () => {
  it("restores seven fictional source-linked tasks", async () => {
    const result = await listTasks(user, filters);
    expect(result.tasks).toHaveLength(7);
    expect(result.tasks.map((task) => task.title)).toEqual(
      expect.arrayContaining([
        "Approve Aurora proposal",
        "Confirm interview attendance",
        "Pay invoice before deadline",
        "Prepare agenda for team meeting",
        "Review security alert",
        "Send design feedback",
        "Review subscription renewal",
      ]),
    );
  });

  it("creates a manual task without accepting an email source", async () => {
    const task = await createManualTask(user, { title: "Manual reminder" });
    expect(task).toMatchObject({
      id: "demo-created-1",
      source: "manual",
      priority: "medium",
      threadId: null,
      sourceEmail: null,
    });
  });

  it("creates an extracted action once and returns the duplicate", async () => {
    const input = {
      analysisId: DEMO_ANALYSIS_IDS["proposal-approval"]!,
      actionIndex: 0,
    };
    const first = await createTaskFromAnalysis(user, input);
    const second = await createTaskFromAnalysis(user, input);
    expect(first).toMatchObject({ created: true, duplicate: false });
    expect(second).toMatchObject({ created: false, duplicate: true });
    expect(second.task.id).toBe(first.task.id);
    expect(first.task.sourceEmail?.evidence).toMatch(/approve/i);
  });

  it("rejects missing analyses and action indexes safely", async () => {
    await expect(
      createTaskFromAnalysis(user, {
        analysisId: "00000000-0000-4000-8000-999999999999",
        actionIndex: 0,
      }),
    ).rejects.toMatchObject({ code: "ACTION_ITEM_NOT_FOUND", status: 404 });
    await expect(
      createTaskFromAnalysis(user, {
        analysisId: DEMO_ANALYSIS_IDS["newsletter"]!,
        actionIndex: 0,
      }),
    ).rejects.toMatchObject({ code: "ACTION_ITEM_NOT_FOUND", status: 404 });
  });

  it("filters, paginates, completes idempotently, and reopens", async () => {
    const page = await listTasks(user, {
      status: "open",
      limit: 2,
      sort: "priority_desc",
    });
    expect(page.tasks).toHaveLength(2);
    expect(page.nextCursor).not.toBeNull();
    const task = page.tasks[0]!;
    const completed = await updateTask(user, task.id, { status: "completed" });
    const repeated = await updateTask(user, task.id, { status: "completed" });
    expect(repeated.completedAt).toBe(completed.completedAt);
    const reopened = await updateTask(user, task.id, { status: "open" });
    expect(reopened.completedAt).toBeNull();
  });

  it("gets, updates, and idempotently deletes a task", async () => {
    const created = await createManualTask(user, { title: "Temporary" });
    expect((await getTask(user, created.id)).title).toBe("Temporary");
    expect(
      (await updateTask(user, created.id, { priority: "high" })).priority,
    ).toBe("high");
    expect(await deleteTask(user, created.id)).toEqual({ deleted: true });
    expect(await deleteTask(user, created.id)).toEqual({ deleted: false });
    await expect(getTask(user, created.id)).rejects.toMatchObject({
      code: "TASK_NOT_FOUND",
    });
  });
});
