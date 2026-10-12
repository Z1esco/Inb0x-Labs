import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadReplyThread: vi.fn(),
  loadCurrentReplyAnalysis: vi.fn(),
  findReplyCache: vi.fn(),
  persistReply: vi.fn(),
  draftWithOpenAI: vi.fn(),
  createAdmin: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getEnvironment: () => ({
    OPENAI_API_KEY: "test-key",
    OPENAI_MODEL: "test-model",
    THREAD_MAX_CHARACTERS: 12_000,
    REPLY_DAILY_LIMIT: 20,
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createAdmin,
}));
vi.mock("@/server/ai/openai-service", () => ({
  draftWithOpenAI: mocks.draftWithOpenAI,
}));
vi.mock("@/server/replies/reply-repository", async () => {
  const actual = await vi.importActual<
    typeof import("@/server/replies/reply-repository")
  >("@/server/replies/reply-repository");
  return {
    ...actual,
    loadReplyThread: mocks.loadReplyThread,
    loadCurrentReplyAnalysis: mocks.loadCurrentReplyAnalysis,
    findReplyCache: mocks.findReplyCache,
    persistReply: mocks.persistReply,
  };
});

import { createReplyDraft } from "@/server/replies/reply-service";

const user = { id: "user-1", email: "user@example.test", demo: false };
const thread = {
  id: "thread-1",
  subject: "Approval",
  normalizedText: "Please approve the proposal.",
  contentHash: "a".repeat(64),
  containsPotentialPromptInjection: false,
  messages: [
    {
      id: "message-1",
      from: "sender@example.test",
      to: ["user@example.test"],
      cc: [],
      sentAt: "2026-07-16T08:00:00.000Z",
      subject: "Approval",
      body: "Please approve the proposal.",
      attachments: [],
    },
  ],
};
const draftOutput = {
  subject: "Approval",
  body: "Thank you for the approval request.",
  tone: "balanced",
  length: "short",
  confidence: 0.9,
  usedFacts: ["Please approve the proposal"],
  uncertainPoints: [],
  warnings: [],
  evidence: [
    {
      claim: "Approval requested",
      sourceMessageId: "message-1",
      excerpt: "Please approve the proposal",
    },
  ],
};

function storedRow() {
  return {
    id: "draft-1",
    email_thread_id: "thread-1",
    email_analysis_id: null,
    ...draftOutput,
    used_facts: draftOutput.usedFacts,
    uncertain_points: draftOutput.uncertainPoints,
    created_at: "2026-07-16T00:00:00.000Z",
    updated_at: "2026-07-16T00:00:00.000Z",
  };
}

function admin(
  reservation: { event_id: string | null; used: number } = {
    event_id: "event-1",
    used: 1,
  },
) {
  const response = { data: null, error: null, count: 0 };
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  Object.assign(builder, {
    select: chain,
    update: chain,
    eq: chain,
    gte: chain,
    then: (resolve: (value: typeof response) => unknown) =>
      Promise.resolve(response).then(resolve),
  });
  return {
    from: vi.fn(() => builder),
    rpc: vi.fn().mockResolvedValue({ data: reservation, error: null }),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadReplyThread.mockResolvedValue(thread);
  mocks.loadCurrentReplyAnalysis.mockResolvedValue(null);
  mocks.findReplyCache.mockResolvedValue(null);
  mocks.persistReply.mockResolvedValue(storedRow());
  mocks.draftWithOpenAI.mockResolvedValue({
    output: draftOutput,
    responseId: "response-1",
    model: "test-model",
    inputTokens: 100,
    outputTokens: 40,
  });
  mocks.createAdmin.mockReturnValue(admin());
});

describe("real reply service", () => {
  it("returns a cache hit without reserving usage or calling OpenAI", async () => {
    const client = admin();
    mocks.createAdmin.mockReturnValue(client);
    mocks.findReplyCache.mockResolvedValue(storedRow());
    const result = await createReplyDraft(user, {
      threadId: "thread-1",
      tone: "balanced",
      length: "short",
      force: false,
    });
    expect(result.cached).toBe(true);
    expect(result.draft.copyOnly).toBe(true);
    expect(result.draft.sent).toBe(false);
    expect(client.rpc).not.toHaveBeenCalled();
    expect(mocks.draftWithOpenAI).not.toHaveBeenCalled();
  });

  it("reserves one call, grounds output, persists, and records token usage", async () => {
    const client = admin();
    mocks.createAdmin.mockReturnValue(client);
    const result = await createReplyDraft(user, {
      threadId: "thread-1",
      tone: "balanced",
      length: "short",
      force: true,
    });
    expect(result.cached).toBe(false);
    expect(client.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.draftWithOpenAI).toHaveBeenCalledTimes(1);
    expect(mocks.persistReply).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "user-1",
        thread_content_hash: "a".repeat(64),
        input_tokens: 100,
        output_tokens: 40,
      }),
    );
  });

  it("fails before model access for missing normalized content", async () => {
    mocks.loadReplyThread.mockResolvedValue({
      ...thread,
      normalizedText: "",
      messages: [],
    });
    await expect(
      createReplyDraft(user, {
        threadId: "thread-1",
        tone: "balanced",
        length: "short",
        force: false,
      }),
    ).rejects.toMatchObject({ code: "THREAD_CONTENT_UNAVAILABLE" });
    expect(mocks.draftWithOpenAI).not.toHaveBeenCalled();
  });

  it("stops when the atomic daily reservation rejects the call", async () => {
    mocks.createAdmin.mockReturnValue(admin({ event_id: null, used: 20 }));
    await expect(
      createReplyDraft(user, {
        threadId: "thread-1",
        tone: "balanced",
        length: "short",
        force: false,
      }),
    ).rejects.toMatchObject({ code: "REPLY_LIMIT_REACHED", status: 429 });
    expect(mocks.draftWithOpenAI).not.toHaveBeenCalled();
  });
});
