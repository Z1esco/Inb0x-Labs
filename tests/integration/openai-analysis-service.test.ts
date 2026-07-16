import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  analyzeWithOpenAI: vi.fn(),
  getRealSettings: vi.fn(),
  createAdmin: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getEnvironment: () => ({
    OPENAI_API_KEY: "test-key",
    OPENAI_MODEL: "test-model",
    ANALYSIS_DAILY_LIMIT: 20,
    ANALYSIS_BATCH_LIMIT: 10,
    THREAD_MAX_CHARACTERS: 12_000,
  }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: mocks.createAdmin,
}));
vi.mock("@/server/ai/openai-service", () => ({
  analyzeWithOpenAI: mocks.analyzeWithOpenAI,
}));
vi.mock("@/server/services/real-data", () => ({
  getRealSettings: mocks.getRealSettings,
}));

import { analyzeRealThread } from "@/server/ai/analysis-service";

const analysis = {
  summary: "The sender requests approval.",
  category: "work",
  priorityScore: 80,
  priorityLevel: "high",
  priorityReason: "Approval is directly requested.",
  needsReply: true,
  replyReason: "The sender asks for approval.",
  confidence: 0.9,
  deadlines: [],
  actionItems: [],
  meetings: [],
  evidence: [
    {
      claim: "Approval is requested.",
      sourceMessageId: "message-1",
      excerpt: "Please approve",
    },
  ],
  safetyFlags: [],
};

const thread = {
  id: "thread-1",
  subject: "Approval",
  participants: ["sender@example.test"],
  normalized_text: "Please approve",
  content_hash: "content-hash",
  contains_potential_prompt_injection: false,
  messages: [
    {
      id: "message-1",
      from: "sender@example.test",
      to: ["user@example.test"],
      cc: [],
      sentAt: "2026-07-16T08:00:00.000Z",
      subject: "Approval",
      body: "Please approve",
    },
  ],
};

function cacheRow(value = analysis) {
  return {
    summary: value.summary,
    category: value.category,
    priority_score: value.priorityScore,
    priority_level: value.priorityLevel,
    priority_reason: value.priorityReason,
    needs_reply: value.needsReply,
    reply_reason: value.replyReason,
    confidence: value.confidence,
    deadlines: value.deadlines,
    action_items: value.actionItems,
    meetings: value.meetings,
    evidence: value.evidence,
    safety_flags: value.safetyFlags,
  };
}

interface DatabaseState {
  thread: typeof thread | null;
  cache: ReturnType<typeof cacheRow> | null;
  usageCount: number;
  reservation: { event_id: string | null; used: number };
  filters: Array<[string, string, unknown]>;
  upserts: unknown[];
  updates: unknown[];
}

function database(state: DatabaseState) {
  const from = (table: string) => {
    let response: { data?: unknown; error: null; count?: number } = {
      error: null,
    };
    const builder = {
      select: (
        _columns?: string,
        options?: { count?: string; head?: boolean },
      ) => {
        if (table === "usage_events" && options?.head)
          response = { error: null, count: state.usageCount };
        return builder;
      },
      eq: (column: string, value: unknown) => {
        state.filters.push([table, column, value]);
        return builder;
      },
      gte: () => builder,
      maybeSingle: async () => ({
        data:
          table === "email_threads"
            ? state.thread
            : table === "email_analyses"
              ? state.cache
              : null,
        error: null,
      }),
      upsert: async (value: unknown) => {
        state.upserts.push(value);
        return { error: null };
      },
      update: (value: unknown) => {
        state.updates.push(value);
        return builder;
      },
      then: <TResult1 = { data?: unknown; error: null; count?: number }>(
        resolve: (value: typeof response) => TResult1 | PromiseLike<TResult1>,
      ) => Promise.resolve(response).then(resolve),
    };
    return builder;
  };
  return {
    from,
    rpc: vi.fn().mockResolvedValue({ data: state.reservation, error: null }),
  };
}

function setupDatabase(overrides: Partial<DatabaseState> = {}) {
  const state: DatabaseState = {
    thread,
    cache: null,
    usageCount: 0,
    reservation: { event_id: "usage-1", used: 1 },
    filters: [],
    upserts: [],
    updates: [],
    ...overrides,
  };
  const client = database(state);
  mocks.createAdmin.mockReturnValue(client);
  return { state, client };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getRealSettings.mockResolvedValue({ dailyAnalysisLimit: 20 });
  mocks.analyzeWithOpenAI.mockResolvedValue({
    output: analysis,
    responseId: "response-1",
    model: "test-model",
    inputTokens: 100,
    outputTokens: 50,
  });
});

describe("analysis cache, ownership, and quota", () => {
  it("returns a cache hit without reserving or calling OpenAI", async () => {
    const { state, client } = setupDatabase({
      cache: cacheRow(),
      usageCount: 4,
    });
    const result = await analyzeRealThread("user-1", "thread-1", false);
    expect(result.cached).toBe(true);
    expect(result.usage).toEqual({ used: 4, limit: 20, remaining: 16 });
    expect(client.rpc).not.toHaveBeenCalled();
    expect(mocks.analyzeWithOpenAI).not.toHaveBeenCalled();
    expect(state.filters).toContainEqual([
      "email_threads",
      "user_id",
      "user-1",
    ]);
    expect(state.filters).toContainEqual([
      "email_analyses",
      "model",
      "test-model",
    ]);
  });

  it("force mode reserves once, grounds output, persists, and records tokens", async () => {
    const { state, client } = setupDatabase({ cache: cacheRow() });
    const result = await analyzeRealThread("user-1", "thread-1", true);
    expect(result.cached).toBe(false);
    expect(client.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.analyzeWithOpenAI).toHaveBeenCalledTimes(1);
    expect(state.upserts).toHaveLength(1);
    expect(state.updates).toHaveLength(1);
    expect(state.updates[0]).toMatchObject({
      model: "test-model",
      input_tokens: 100,
      output_tokens: 50,
    });
  });

  it("fails closed when an owned thread is absent", async () => {
    setupDatabase({ thread: null });
    await expect(
      analyzeRealThread("user-1", "thread-from-another-user", false),
    ).rejects.toMatchObject({ code: "THREAD_NOT_FOUND", status: 404 });
    expect(mocks.analyzeWithOpenAI).not.toHaveBeenCalled();
  });

  it("stops at an atomically rejected daily reservation", async () => {
    const { state } = setupDatabase({
      reservation: { event_id: null, used: 20 },
    });
    await expect(
      analyzeRealThread("user-1", "thread-1", false),
    ).rejects.toMatchObject({ code: "ANALYSIS_LIMIT_REACHED", status: 429 });
    expect(mocks.analyzeWithOpenAI).not.toHaveBeenCalled();
    expect(state.upserts).toEqual([]);
  });

  it("never persists invalid model output", async () => {
    const { state } = setupDatabase();
    mocks.analyzeWithOpenAI.mockResolvedValue({
      output: { ...analysis, confidence: 2 },
      responseId: "invalid",
      model: "test-model",
      inputTokens: 1,
      outputTokens: 1,
    });
    await expect(
      analyzeRealThread("user-1", "thread-1", false),
    ).rejects.toThrow();
    expect(state.upserts).toEqual([]);
  });
});
