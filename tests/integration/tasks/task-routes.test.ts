import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  listTasks: vi.fn(),
  createManualTask: vi.fn(),
  createTaskFromAnalysis: vi.fn(),
  getTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
}));

vi.mock("@/server/auth/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));
vi.mock("@/server/tasks/task-service", () => ({
  listTasks: mocks.listTasks,
  createManualTask: mocks.createManualTask,
  createTaskFromAnalysis: mocks.createTaskFromAnalysis,
  getTask: mocks.getTask,
  updateTask: mocks.updateTask,
  deleteTask: mocks.deleteTask,
}));

import {
  DELETE as deleteRoute,
  GET as detailRoute,
  PATCH as updateRoute,
} from "@/app/api/tasks/[taskId]/route";
import { POST as fromAnalysisRoute } from "@/app/api/tasks/from-analysis/route";
import { GET as listRoute, POST as createRoute } from "@/app/api/tasks/route";
import { clearRateLimits } from "@/server/rate-limit/limiter";

const user = { id: "auth-user", email: "user@example.test", demo: false };
const task = {
  id: "task-1",
  threadId: null,
  analysisId: null,
  title: "Manual task",
  description: null,
  source: "manual",
  status: "open",
  priority: "medium",
  dueAt: null,
  completedAt: null,
  sourceEmail: null,
  createdAt: "2026-07-16T00:00:00.000Z",
  updatedAt: "2026-07-16T00:00:00.000Z",
};

function post(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  clearRateLimits();
  mocks.requireCurrentUser.mockResolvedValue(user);
  mocks.listTasks.mockResolvedValue({
    tasks: [task],
    total: 1,
    nextCursor: null,
  });
  mocks.createManualTask.mockResolvedValue(task);
  mocks.createTaskFromAnalysis.mockResolvedValue({
    task,
    created: true,
    duplicate: false,
  });
  mocks.getTask.mockResolvedValue(task);
  mocks.updateTask.mockResolvedValue({ ...task, status: "completed" });
  mocks.deleteTask.mockResolvedValue({ deleted: true });
});

afterEach(clearRateLimits);

describe("task route authentication", () => {
  it.each([
    ["list", () => listRoute(new Request("http://localhost/api/tasks"))],
    [
      "create",
      () => createRoute(post("http://localhost/api/tasks", { title: "Task" })),
    ],
    [
      "from analysis",
      () =>
        fromAnalysisRoute(
          post("http://localhost/api/tasks/from-analysis", {
            analysisId: "00000000-0000-4000-8000-000000000001",
            actionIndex: 0,
          }),
        ),
    ],
    [
      "detail",
      () =>
        detailRoute(new Request("http://localhost/api/tasks/task-1"), {
          params: Promise.resolve({ taskId: "task-1" }),
        }),
    ],
    [
      "update",
      () =>
        updateRoute(
          post("http://localhost/api/tasks/task-1", { status: "completed" }),
          { params: Promise.resolve({ taskId: "task-1" }) },
        ),
    ],
    [
      "delete",
      () =>
        deleteRoute(
          new Request("http://localhost/api/tasks/task-1", {
            method: "DELETE",
          }),
          { params: Promise.resolve({ taskId: "task-1" }) },
        ),
    ],
  ])("rejects unauthenticated %s requests", async (_name, invoke) => {
    mocks.requireCurrentUser.mockRejectedValue(
      new AppError("UNAUTHENTICATED", "Please sign in to continue.", 401),
    );
    const response = await invoke();
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHENTICATED");
  });
});

describe("GET /api/tasks", () => {
  it("passes validated filters with authenticated ownership", async () => {
    const response = await listRoute(
      new Request(
        "http://localhost/api/tasks?status=open&priority=high&source=manual&limit=10&sort=due_asc",
      ),
    );
    expect(response.status).toBe(200);
    expect(mocks.listTasks).toHaveBeenCalledWith(
      user,
      expect.objectContaining({
        status: "open",
        priority: "high",
        source: "manual",
        limit: 10,
        sort: "due_asc",
      }),
    );
    expect((await response.json()).meta.pagination).toEqual({
      nextCursor: null,
      limit: 10,
      total: 1,
    });
  });

  it("rejects unknown filters", async () => {
    const response = await listRoute(
      new Request("http://localhost/api/tasks?userId=another-user"),
    );
    expect(response.status).toBe(400);
    expect(mocks.listTasks).not.toHaveBeenCalled();
  });
});

describe("task creation routes", () => {
  it("creates only a manual source with server defaults", async () => {
    const response = await createRoute(
      post("http://localhost/api/tasks", { title: "  Manual task  " }),
    );
    expect(response.status).toBe(201);
    expect(mocks.createManualTask).toHaveBeenCalledWith(user, {
      title: "Manual task",
      priority: "medium",
    });
  });

  it("rejects client-supplied ownership and source fields", async () => {
    const response = await createRoute(
      post("http://localhost/api/tasks", {
        title: "Forged task",
        userId: "another-user",
        source: "email_action",
        analysisId: "00000000-0000-4000-8000-000000000001",
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.createManualTask).not.toHaveBeenCalled();
  });

  it("accepts only an analysis ID and action index", async () => {
    const input = {
      analysisId: "00000000-0000-4000-8000-000000000001",
      actionIndex: 0,
    };
    const response = await fromAnalysisRoute(
      post("http://localhost/api/tasks/from-analysis", input),
    );
    expect(response.status).toBe(201);
    expect(mocks.createTaskFromAnalysis).toHaveBeenCalledWith(user, input);
    expect((await response.json()).meta).toMatchObject({
      created: true,
      duplicate: false,
    });
  });

  it("rejects fake action content from the client", async () => {
    const response = await fromAnalysisRoute(
      post("http://localhost/api/tasks/from-analysis", {
        analysisId: "00000000-0000-4000-8000-000000000001",
        actionIndex: 0,
        title: "Injected action",
        evidence: "Fake evidence",
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.createTaskFromAnalysis).not.toHaveBeenCalled();
  });
});

describe("GET/PATCH/DELETE /api/tasks/[taskId]", () => {
  it("uses the authenticated user for detail ownership", async () => {
    await detailRoute(new Request("http://localhost/api/tasks/task-1"), {
      params: Promise.resolve({ taskId: " task-1 " }),
    });
    expect(mocks.getTask).toHaveBeenCalledWith(user, "task-1");
  });

  it("allows lifecycle fields and rejects immutable source fields", async () => {
    const accepted = await updateRoute(
      post("http://localhost/api/tasks/task-1", { status: "completed" }),
      { params: Promise.resolve({ taskId: "task-1" }) },
    );
    expect(accepted.status).toBe(200);
    const rejected = await updateRoute(
      post("http://localhost/api/tasks/task-1", {
        source: "manual",
        sourceMessageId: "forged",
      }),
      { params: Promise.resolve({ taskId: "task-1" }) },
    );
    expect(rejected.status).toBe(400);
  });

  it("returns stable not-found and idempotent delete responses", async () => {
    mocks.getTask.mockRejectedValue(
      new AppError("TASK_NOT_FOUND", "The requested task was not found.", 404),
    );
    const missing = await detailRoute(
      new Request("http://localhost/api/tasks/missing"),
      { params: Promise.resolve({ taskId: "missing" }) },
    );
    expect(missing.status).toBe(404);
    expect((await missing.json()).error.code).toBe("TASK_NOT_FOUND");
    mocks.deleteTask.mockResolvedValue({ deleted: false });
    const deleted = await deleteRoute(
      new Request("http://localhost/api/tasks/missing", { method: "DELETE" }),
      { params: Promise.resolve({ taskId: "missing" }) },
    );
    expect(deleted.status).toBe(200);
    expect((await deleted.json()).data).toEqual({ deleted: false });
  });
});
