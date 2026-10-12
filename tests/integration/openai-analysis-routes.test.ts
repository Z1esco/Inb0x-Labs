import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  analyzeRealThread: vi.fn(),
  analyzeRealInbox: vi.fn(),
  getCurrentAnalysis: vi.fn(),
  getDemoThread: vi.fn(),
}));

vi.mock("@/server/auth/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));
vi.mock("@/server/ai/analysis-service", () => ({
  analyzeRealThread: mocks.analyzeRealThread,
  analyzeRealInbox: mocks.analyzeRealInbox,
  getCurrentAnalysis: mocks.getCurrentAnalysis,
}));
vi.mock("@/server/services/demo-store", () => ({
  getDemoThread: mocks.getDemoThread,
}));

import { GET as getAnalysis } from "@/app/api/analysis/[threadId]/route";
import { POST as analyzeInbox } from "@/app/api/analysis/inbox/route";
import { POST as analyzeThread } from "@/app/api/analysis/thread/route";
import { clearRateLimits } from "@/server/rate-limit/limiter";

const analysis = {
  summary: "Approval is requested.",
  category: "work",
  priorityScore: 80,
  priorityLevel: "high",
  priorityReason: "A timely response is required.",
  needsReply: true,
  replyReason: "The sender asks for approval.",
  confidence: 0.9,
  deadlines: [],
  actionItems: [],
  meetings: [],
  evidence: [],
  safetyFlags: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  clearRateLimits();
  mocks.requireCurrentUser.mockResolvedValue({ id: "auth-user", demo: false });
  mocks.analyzeRealThread.mockResolvedValue({
    analysisId: "analysis-real",
    analysis,
    cached: false,
    usage: { used: 1, limit: 20, remaining: 19 },
  });
  mocks.analyzeRealInbox.mockResolvedValue({
    requested: 1,
    analyzed: 1,
    cached: 0,
    failed: 0,
    skipped: 0,
    limitReached: false,
    usage: { used: 1, limit: 20, remaining: 19 },
    results: [{ threadId: "thread-1", status: "analyzed", errorCode: null }],
  });
  mocks.getCurrentAnalysis.mockResolvedValue({
    analysisId: "analysis-real",
    analysis,
    cached: true,
    usage: { used: 1, limit: 20, remaining: 19 },
  });
});

afterEach(clearRateLimits);

function jsonRequest(url: string, body: unknown) {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("analysis route authentication", () => {
  it.each([
    [
      "thread",
      () =>
        analyzeThread(
          jsonRequest("http://localhost/api/analysis/thread", {
            threadId: "thread-1",
          }),
        ),
    ],
    [
      "inbox",
      () =>
        analyzeInbox(
          jsonRequest("http://localhost/api/analysis/inbox", {
            threadIds: ["thread-1"],
          }),
        ),
    ],
    [
      "get",
      () =>
        getAnalysis(new Request("http://localhost/api/analysis/thread-1"), {
          params: Promise.resolve({ threadId: "thread-1" }),
        }),
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

describe("POST /api/analysis/thread", () => {
  it("uses only the authenticated user and returns usage metadata", async () => {
    const response = await analyzeThread(
      jsonRequest("http://localhost/api/analysis/thread", {
        threadId: "thread-1",
        force: true,
      }),
    );
    expect(response.status).toBe(200);
    expect(mocks.analyzeRealThread).toHaveBeenCalledWith(
      "auth-user",
      "thread-1",
      true,
    );
    expect((await response.json()).meta).toMatchObject({
      analysisId: "analysis-real",
      cached: false,
      usage: { used: 1, limit: 20, remaining: 19 },
    });
  });

  it("rejects client user IDs and malformed input", async () => {
    const response = await analyzeThread(
      jsonRequest("http://localhost/api/analysis/thread", {
        threadId: "thread-1",
        userId: "another-user",
      }),
    );
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_REQUEST");
    expect(mocks.analyzeRealThread).not.toHaveBeenCalled();
  });

  it("returns deterministic demo analysis without the real service", async () => {
    mocks.requireCurrentUser.mockResolvedValue({ id: "demo", demo: true });
    mocks.getDemoThread.mockReturnValue({
      analysisId: "00000000-0000-4000-8000-000000000001",
      analysis,
    });
    const response = await analyzeThread(
      jsonRequest("http://localhost/api/analysis/thread", {
        threadId: "demo-thread",
      }),
    );
    const body = await response.json();
    expect(body.meta).toMatchObject({
      analysisId: "00000000-0000-4000-8000-000000000001",
      demo: true,
      cached: true,
    });
    expect(body.meta.usage.used).toBe(0);
    expect(mocks.analyzeRealThread).not.toHaveBeenCalled();
  });
});

describe("POST /api/analysis/inbox", () => {
  it("deduplicates IDs before calling the bounded batch service", async () => {
    await analyzeInbox(
      jsonRequest("http://localhost/api/analysis/inbox", {
        threadIds: ["thread-1", "thread-1"],
      }),
    );
    expect(mocks.analyzeRealInbox).toHaveBeenCalledWith(
      "auth-user",
      ["thread-1"],
      false,
    );
  });

  it("preserves safe partial batch results", async () => {
    mocks.analyzeRealInbox.mockResolvedValue({
      requested: 2,
      analyzed: 1,
      cached: 0,
      failed: 1,
      skipped: 0,
      limitReached: false,
      usage: { used: 1, limit: 20, remaining: 19 },
      results: [
        { threadId: "one", status: "analyzed", errorCode: null },
        {
          threadId: "two",
          status: "failed",
          errorCode: "MODEL_OUTPUT_INVALID",
        },
      ],
    });
    const response = await analyzeInbox(
      jsonRequest("http://localhost/api/analysis/inbox", {
        threadIds: ["one", "two"],
      }),
    );
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.failed).toBe(1);
    expect(body.data.results[1]).toEqual({
      threadId: "two",
      status: "failed",
      errorCode: "MODEL_OUTPUT_INVALID",
    });
  });
});

describe("GET /api/analysis/[threadId]", () => {
  it("checks ownership through the authenticated user", async () => {
    const response = await getAnalysis(
      new Request("http://localhost/api/analysis/thread-1"),
      { params: Promise.resolve({ threadId: " thread-1 " }) },
    );
    expect(response.status).toBe(200);
    expect(mocks.getCurrentAnalysis).toHaveBeenCalledWith(
      "auth-user",
      "thread-1",
    );
  });

  it("maps unauthorized ownership lookups to the stable not-found error", async () => {
    mocks.getCurrentAnalysis.mockRejectedValue(
      new AppError("THREAD_NOT_FOUND", "No current analysis exists.", 404),
    );
    const response = await getAnalysis(
      new Request("http://localhost/api/analysis/other"),
      { params: Promise.resolve({ threadId: "other" }) },
    );
    expect(response.status).toBe(404);
    expect((await response.json()).error.code).toBe("THREAD_NOT_FOUND");
  });
});
