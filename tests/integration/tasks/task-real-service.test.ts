import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOwnedAnalysisActionRow: vi.fn(),
  insertDerivedTaskRow: vi.fn(),
  getTaskRow: vi.fn(),
  updateTaskRow: vi.fn(),
  deleteTaskRow: vi.fn(),
  insertManualTaskRow: vi.fn(),
  listTaskRows: vi.fn(),
}));

vi.mock("@/server/tasks/task-repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/server/tasks/task-repository")
  >("@/server/tasks/task-repository");
  return { ...actual, ...mocks };
});

import {
  createTaskFromAnalysis,
  getTask,
  updateTask,
} from "@/server/tasks/task-service";
import type { CurrentUser } from "@/server/auth/current-user";

const user: CurrentUser = {
  id: "user-1",
  email: "user@example.test",
  demo: false,
};
const row = {
  id: "task-1",
  email_thread_id: "thread-1",
  email_analysis_id: "analysis-1",
  source_message_id: "message-1",
  source_evidence: "Please approve",
  title: "Approve proposal",
  description: null,
  source: "email_action",
  status: "open",
  priority: "high",
  due_at: null,
  completed_at: null,
  created_at: "2026-07-16T00:00:00.000Z",
  updated_at: "2026-07-16T00:00:00.000Z",
  email_threads: { subject: "Approval" },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOwnedAnalysisActionRow.mockResolvedValue({
    id: "analysis-1",
    emailThreadId: "thread-1",
    threadSubject: "Approval",
    priority: "high",
    actionItems: [
      {
        title: "Approve proposal",
        description: null,
        assignee: "user",
        dueAt: null,
        confidence: 0.9,
        sourceMessageId: "message-1",
        evidence: "Please approve",
      },
    ],
  });
  mocks.insertDerivedTaskRow.mockResolvedValue({ row, created: true });
  mocks.getTaskRow.mockResolvedValue(row);
  mocks.updateTaskRow.mockResolvedValue(row);
});

describe("real task service ownership and extracted actions", () => {
  it("loads the owned stored action and never accepts client action content", async () => {
    const result = await createTaskFromAnalysis(user, {
      analysisId: "analysis-1",
      actionIndex: 0,
    });
    expect(mocks.getOwnedAnalysisActionRow).toHaveBeenCalledWith(
      "user-1",
      "analysis-1",
    );
    expect(mocks.insertDerivedTaskRow).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        emailThreadId: "thread-1",
        emailAnalysisId: "analysis-1",
        title: "Approve proposal",
        sourceEvidence: "Please approve",
        priority: "high",
        sourceActionKey: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
    );
    expect(result).toMatchObject({ created: true, duplicate: false });
  });

  it("returns a duplicate result from the atomic repository outcome", async () => {
    mocks.insertDerivedTaskRow.mockResolvedValue({ row, created: false });
    const result = await createTaskFromAnalysis(user, {
      analysisId: "analysis-1",
      actionIndex: 0,
    });
    expect(result).toMatchObject({ created: false, duplicate: true });
  });

  it("hides missing or cross-user analyses", async () => {
    mocks.getOwnedAnalysisActionRow.mockResolvedValue(null);
    await expect(
      createTaskFromAnalysis(user, {
        analysisId: "another-users-analysis",
        actionIndex: 0,
      }),
    ).rejects.toMatchObject({ code: "ANALYSIS_NOT_FOUND", status: 404 });
    expect(mocks.insertDerivedTaskRow).not.toHaveBeenCalled();
  });

  it("rejects an unavailable action index", async () => {
    await expect(
      createTaskFromAnalysis(user, {
        analysisId: "analysis-1",
        actionIndex: 3,
      }),
    ).rejects.toMatchObject({ code: "ACTION_ITEM_NOT_FOUND", status: 404 });
  });

  it("hides missing or cross-user task IDs", async () => {
    mocks.getTaskRow.mockResolvedValue(null);
    await expect(getTask(user, "another-users-task")).rejects.toMatchObject({
      code: "TASK_NOT_FOUND",
      status: 404,
    });
  });

  it("preserves the completion timestamp on repeated completion", async () => {
    const completedAt = "2026-07-17T00:00:00.000Z";
    mocks.getTaskRow.mockResolvedValue({
      ...row,
      status: "completed",
      completed_at: completedAt,
    });
    mocks.updateTaskRow.mockResolvedValue({
      ...row,
      status: "completed",
      completed_at: completedAt,
    });
    await updateTask(user, "task-1", { status: "completed" });
    expect(mocks.updateTaskRow).toHaveBeenCalledWith(
      "user-1",
      "task-1",
      { status: "completed" },
      completedAt,
    );
  });
});
