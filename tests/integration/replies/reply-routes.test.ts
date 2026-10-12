import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  createReplyDraft: vi.fn(),
  listReplyDrafts: vi.fn(),
  getReplyDraft: vi.fn(),
  deleteReplyDraft: vi.fn(),
}));

vi.mock("@/server/auth/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));
vi.mock("@/server/replies/reply-service", () => ({
  createReplyDraft: mocks.createReplyDraft,
  listReplyDrafts: mocks.listReplyDrafts,
  getReplyDraft: mocks.getReplyDraft,
  deleteReplyDraft: mocks.deleteReplyDraft,
}));

import {
  DELETE as deleteRoute,
  GET as detailRoute,
} from "@/app/api/replies/[draftId]/route";
import { POST as generateRoute } from "@/app/api/replies/draft/route";
import { GET as listRoute } from "@/app/api/replies/route";
import { clearRateLimits } from "@/server/rate-limit/limiter";

const user = { id: "user-1", email: "user@example.test", demo: false };
const draft = {
  id: "draft-1",
  threadId: "thread-1",
  analysisId: null,
  subject: "Re: Topic",
  body: "Thanks for the update.",
  tone: "balanced",
  length: "short",
  confidence: 0.9,
  usedFacts: [],
  uncertainPoints: [],
  warnings: [],
  evidence: [],
  createdAt: "2026-07-16T00:00:00.000Z",
  updatedAt: "2026-07-16T00:00:00.000Z",
  copyOnly: true,
  sent: false,
  isDraftOnly: true,
};

function post(body: unknown) {
  return new Request("http://localhost/api/replies/draft", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  clearRateLimits();
  mocks.requireCurrentUser.mockResolvedValue(user);
  mocks.createReplyDraft.mockResolvedValue({
    draft,
    cached: false,
    usage: { used: 1, limit: 20, remaining: 19 },
  });
  mocks.listReplyDrafts.mockResolvedValue({
    drafts: [draft],
    total: 1,
    nextCursor: null,
  });
  mocks.getReplyDraft.mockResolvedValue(draft);
  mocks.deleteReplyDraft.mockResolvedValue({ deleted: true });
});

describe("reply route authentication and validation", () => {
  it.each([
    [
      "generate",
      () =>
        generateRoute(
          post({ threadId: "thread-1", tone: "balanced", length: "short" }),
        ),
    ],
    ["list", () => listRoute(new Request("http://localhost/api/replies"))],
    [
      "detail",
      () =>
        detailRoute(new Request("http://localhost/api/replies/draft-1"), {
          params: Promise.resolve({ draftId: "draft-1" }),
        }),
    ],
    [
      "delete",
      () =>
        deleteRoute(
          new Request("http://localhost/api/replies/draft-1", {
            method: "DELETE",
          }),
          { params: Promise.resolve({ draftId: "draft-1" }) },
        ),
    ],
  ])("rejects unauthenticated %s", async (_name, invoke) => {
    mocks.requireCurrentUser.mockRejectedValue(
      new AppError("UNAUTHENTICATED", "Please sign in to continue.", 401),
    );
    const response = await invoke();
    expect(response.status).toBe(401);
    expect((await response.json()).error.code).toBe("UNAUTHENTICATED");
  });

  it("rejects client ownership and raw content fields", async () => {
    const response = await generateRoute(
      post({
        threadId: "thread-1",
        tone: "balanced",
        length: "short",
        userId: "another-user",
        body: "forged email content",
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.createReplyDraft).not.toHaveBeenCalled();
  });
});

describe("reply CRUD routes", () => {
  it("generates a copy-only draft with safe metadata", async () => {
    const response = await generateRoute(
      post({ threadId: "thread-1", tone: "balanced", length: "short" }),
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.data).toMatchObject({ copyOnly: true, sent: false });
    expect(body.meta).toMatchObject({ cached: false, copyOnly: true });
  });

  it("validates list filters and returns pagination", async () => {
    const response = await listRoute(
      new Request(
        "http://localhost/api/replies?tone=warm&length=short&limit=10",
      ),
    );
    expect(response.status).toBe(200);
    expect(mocks.listReplyDrafts).toHaveBeenCalledWith(
      user,
      expect.objectContaining({ tone: "warm", length: "short", limit: 10 }),
    );
    expect((await response.json()).meta.pagination.total).toBe(1);
  });

  it("scopes detail and idempotent deletion to the authenticated user", async () => {
    await detailRoute(new Request("http://localhost/api/replies/draft-1"), {
      params: Promise.resolve({ draftId: "draft-1" }),
    });
    await deleteRoute(
      new Request("http://localhost/api/replies/draft-1", { method: "DELETE" }),
      { params: Promise.resolve({ draftId: "draft-1" }) },
    );
    expect(mocks.getReplyDraft).toHaveBeenCalledWith(user, "draft-1");
    expect(mocks.deleteReplyDraft).toHaveBeenCalledWith(user, "draft-1");
  });

  it("maps unauthorized draft IDs to a stable not-found response", async () => {
    mocks.getReplyDraft.mockRejectedValue(
      new AppError(
        "REPLY_DRAFT_NOT_FOUND",
        "The requested reply draft was not found.",
        404,
      ),
    );
    const response = await detailRoute(
      new Request("http://localhost/api/replies/another-users-draft"),
      { params: Promise.resolve({ draftId: "another-users-draft" }) },
    );
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("REPLY_DRAFT_NOT_FOUND");
  });
});
