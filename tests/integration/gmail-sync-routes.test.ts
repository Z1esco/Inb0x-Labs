import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  listPersistedThreads: vi.fn(),
  getPersistedThread: vi.fn(),
  synchronizeGmailThreads: vi.fn(),
  listDemoThreadsPage: vi.fn(),
  getDemoThread: vi.fn(),
}));

vi.mock("@/server/auth/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));
vi.mock("@/server/gmail/service", () => ({
  listPersistedThreads: mocks.listPersistedThreads,
  getPersistedThread: mocks.getPersistedThread,
  synchronizeGmailThreads: mocks.synchronizeGmailThreads,
}));
vi.mock("@/server/services/demo-store", () => ({
  listDemoThreadsPage: mocks.listDemoThreadsPage,
  getDemoThread: mocks.getDemoThread,
}));

import { POST as syncRoute } from "@/app/api/gmail/sync/route";
import { GET as detailRoute } from "@/app/api/gmail/threads/[threadId]/route";
import { GET as listRoute } from "@/app/api/gmail/threads/route";
import { clearRateLimits } from "@/server/rate-limit/limiter";

const listItem = {
  id: "database-thread-id",
  subject: "Fixture",
  participants: ["sender@example.test"],
  senderNames: ["Sender"],
  snippet: "Safe snippet",
  latestMessageAt: "2026-07-16T00:00:00.000Z",
  messageCount: 1,
  hasAttachments: false,
  labels: ["INBOX"],
  analysis: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  clearRateLimits();
  mocks.requireCurrentUser.mockResolvedValue({ id: "auth-user", demo: false });
  mocks.listPersistedThreads.mockResolvedValue({
    threads: [listItem],
    nextPageToken: null,
  });
  mocks.getPersistedThread.mockResolvedValue({
    ...listItem,
    messages: [],
    contentHash: "hash",
    normalizedCharacterCount: 0,
    trimmed: false,
    containsPotentialPromptInjection: false,
  });
  mocks.synchronizeGmailThreads.mockResolvedValue({
    requested: 1,
    fetched: 1,
    created: 1,
    updated: 0,
    unchanged: 0,
    failed: 0,
    nextPageToken: null,
    syncedAt: "2026-07-16T00:00:00.000Z",
  });
});

afterEach(clearRateLimits);

describe("Gmail sync route authentication", () => {
  it.each([
    [
      "list",
      () => listRoute(new NextRequest("http://localhost/api/gmail/threads")),
    ],
    [
      "detail",
      () =>
        detailRoute(new Request("http://localhost/api/gmail/threads/id"), {
          params: Promise.resolve({ threadId: "id" }),
        }),
    ],
    [
      "sync",
      () =>
        syncRoute(
          new NextRequest("http://localhost/api/gmail/sync", {
            method: "POST",
            body: "{}",
            headers: { "content-type": "application/json" },
          }),
        ),
    ],
  ])("rejects an unauthenticated %s request", async (_name, invoke) => {
    mocks.requireCurrentUser.mockRejectedValue(
      new AppError("UNAUTHENTICATED", "Sign in to continue.", 401),
    );
    const response = await invoke();
    const body = await response.json();
    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHENTICATED");
    expect(body.error.requestId).toEqual(expect.any(String));
  });
});

describe("GET /api/gmail/threads", () => {
  it("passes only validated filters with the authenticated user", async () => {
    const response = await listRoute(
      new NextRequest(
        "http://localhost/api/gmail/threads?limit=25&q=invoice&pageToken=MA",
      ),
    );
    expect(response.status).toBe(200);
    expect(mocks.listPersistedThreads).toHaveBeenCalledWith("auth-user", {
      limit: 25,
      pageToken: "MA",
      query: "invoice",
      category: undefined,
      priority: undefined,
      needsReply: undefined,
    });
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data[0]).not.toHaveProperty("normalizedText");
  });

  it("rejects unknown query parameters", async () => {
    const response = await listRoute(
      new NextRequest("http://localhost/api/gmail/threads?userId=another-user"),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_REQUEST");
    expect(mocks.listPersistedThreads).not.toHaveBeenCalled();
  });

  it("uses deterministic demo data without the real service", async () => {
    mocks.requireCurrentUser.mockResolvedValue({ id: "demo", demo: true });
    mocks.listDemoThreadsPage.mockReturnValue({
      threads: [listItem],
      nextPageToken: "MQ",
    });
    const response = await listRoute(
      new NextRequest("http://localhost/api/gmail/threads?limit=1"),
    );
    const body = await response.json();
    expect(body.meta).toEqual({
      demo: true,
      nextPageToken: "MQ",
      connected: true,
    });
    expect(mocks.listPersistedThreads).not.toHaveBeenCalled();
  });

  it("returns a clear error for pre-analysis filters in real mode", async () => {
    mocks.listPersistedThreads.mockRejectedValue(
      new AppError(
        "INVALID_REQUEST",
        "Category, priority, and reply filters require completed email analysis.",
        400,
      ),
    );
    const response = await listRoute(
      new NextRequest("http://localhost/api/gmail/threads?category=urgent"),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_REQUEST");
  });
});

describe("GET /api/gmail/threads/[threadId]", () => {
  it("derives ownership from the authenticated user", async () => {
    const response = await detailRoute(
      new Request("http://localhost/api/gmail/threads/database-thread-id"),
      { params: Promise.resolve({ threadId: "database-thread-id" }) },
    );
    expect(response.status).toBe(200);
    expect(mocks.getPersistedThread).toHaveBeenCalledWith(
      "auth-user",
      "database-thread-id",
    );
  });

  it("returns a stable not-found error in demo mode", async () => {
    mocks.requireCurrentUser.mockResolvedValue({ id: "demo", demo: true });
    mocks.getDemoThread.mockReturnValue(undefined);
    const response = await detailRoute(
      new Request("http://localhost/api/gmail/threads/missing"),
      { params: Promise.resolve({ threadId: "missing" }) },
    );
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("THREAD_NOT_FOUND");
  });
});

describe("POST /api/gmail/sync", () => {
  it("validates and bounds input before calling the sync service", async () => {
    const response = await syncRoute(
      new NextRequest("http://localhost/api/gmail/sync", {
        method: "POST",
        body: JSON.stringify({ limit: 25, query: "from:boss@example.test" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.synchronizeGmailThreads).toHaveBeenCalledWith("auth-user", {
      limit: 25,
      query: "from:boss@example.test",
    });
  });

  it("rejects excessive limits and client-supplied user IDs", async () => {
    const response = await syncRoute(
      new NextRequest("http://localhost/api/gmail/sync", {
        method: "POST",
        body: JSON.stringify({ limit: 51, userId: "another-user" }),
        headers: { "content-type": "application/json" },
      }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_REQUEST");
    expect(mocks.synchronizeGmailThreads).not.toHaveBeenCalled();
  });

  it("returns a deterministic demo summary without Google", async () => {
    mocks.requireCurrentUser.mockResolvedValue({ id: "demo", demo: true });
    const response = await syncRoute(
      new NextRequest("http://localhost/api/gmail/sync", {
        method: "POST",
        body: "{}",
        headers: { "content-type": "application/json" },
      }),
    );
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toMatchObject({ failed: 0, unchanged: 12 });
    expect(mocks.synchronizeGmailThreads).not.toHaveBeenCalled();
  });

  it("accepts an empty body and applies the default limit", async () => {
    const response = await syncRoute(
      new NextRequest("http://localhost/api/gmail/sync", { method: "POST" }),
    );
    expect(response.status).toBe(200);
    expect(mocks.synchronizeGmailThreads).toHaveBeenCalledWith("auth-user", {
      limit: 25,
    });
  });
});
