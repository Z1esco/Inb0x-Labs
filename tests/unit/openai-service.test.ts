import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => {
  class RateLimitError extends Error {}
  class APIConnectionTimeoutError extends Error {}
  return {
    parse: vi.fn(),
    constructor: vi.fn(),
    RateLimitError,
    APIConnectionTimeoutError,
  };
});

vi.mock("openai", () => {
  class OpenAI {
    static RateLimitError = mocks.RateLimitError;
    static APIConnectionTimeoutError = mocks.APIConnectionTimeoutError;
    responses = { parse: mocks.parse };

    constructor(options: unknown) {
      mocks.constructor(options);
    }
  }
  return { default: OpenAI };
});

vi.mock("@/lib/env", () => ({
  getEnvironment: () => ({
    OPENAI_API_KEY: "test-key-not-real",
    OPENAI_MODEL: "account-model",
    OPENAI_REASONING_EFFORT: "low",
    OPENAI_TIMEOUT_MS: 30_000,
    OPENAI_MAX_RETRIES: 1,
  }),
}));

import { analyzeWithOpenAI, draftWithOpenAI } from "@/server/ai/openai-service";

const output = {
  summary: "A short grounded summary.",
  category: "work",
  priorityScore: 50,
  priorityLevel: "medium",
  priorityReason: "The message contains a non-urgent request.",
  needsReply: true,
  replyReason: "The sender asks a direct question.",
  confidence: 0.8,
  deadlines: [],
  actionItems: [],
  meetings: [],
  evidence: [],
  safetyFlags: [],
};

beforeEach(() => vi.clearAllMocks());

describe("OpenAI Responses analysis client", () => {
  it("uses strict parsed output with server-side safety settings", async () => {
    mocks.parse.mockResolvedValue({
      id: "resp_test",
      model: "account-model",
      output_parsed: output,
      usage: { input_tokens: 120, output_tokens: 40 },
    });
    const result = await analyzeWithOpenAI(
      "<thread_data>{}</thread_data>",
      "safe-user-hash",
    );

    expect(mocks.constructor).toHaveBeenCalledWith({
      apiKey: "test-key-not-real",
      timeout: 30_000,
      maxRetries: 1,
    });
    const request = mocks.parse.mock.calls[0]?.[0];
    expect(request).toMatchObject({
      model: "account-model",
      store: false,
      parallel_tool_calls: false,
      safety_identifier: "safe-user-hash",
      metadata: {
        prompt_version: "analyze-thread-v2",
        schema_version: "2",
      },
    });
    expect(request.instructions).toMatch(/untrusted data/i);
    expect(request.input).toEqual([
      { role: "user", content: "<thread_data>{}</thread_data>" },
    ]);
    expect(request.text.format).toMatchObject({
      type: "json_schema",
      strict: true,
    });
    expect(result).toMatchObject({
      output,
      responseId: "resp_test",
      model: "account-model",
      inputTokens: 120,
      outputTokens: 40,
    });
  });

  it("rejects missing parsed output without attempting free-form repair", async () => {
    mocks.parse.mockResolvedValue({
      id: "resp_invalid",
      model: "account-model",
      output_parsed: null,
    });
    await expect(
      analyzeWithOpenAI("<thread_data>{}</thread_data>", "safe-user-hash"),
    ).rejects.toMatchObject({
      code: "MODEL_OUTPUT_INVALID",
      status: 502,
    } satisfies Partial<AppError>);
    expect(mocks.parse).toHaveBeenCalledTimes(1);
  });

  it("maps provider failures to stable safe application errors", async () => {
    mocks.parse.mockRejectedValue(
      new mocks.RateLimitError("raw provider body"),
    );
    await expect(
      analyzeWithOpenAI("<thread_data>{}</thread_data>", "safe-user-hash"),
    ).rejects.toMatchObject({
      code: "RATE_LIMITED",
      status: 429,
      message: "The analysis service is temporarily rate limited.",
    });
  });

  it("maps timeouts without leaking provider details", async () => {
    mocks.parse.mockRejectedValue(
      new mocks.APIConnectionTimeoutError("request with private content"),
    );
    await expect(
      analyzeWithOpenAI("<thread_data>{}</thread_data>", "safe-user-hash"),
    ).rejects.toMatchObject({
      code: "ANALYSIS_FAILED",
      status: 504,
      message: "The analysis request timed out. Please try again.",
    });
  });
});

describe("OpenAI Responses reply client", () => {
  const draft = {
    subject: "Re: Approval",
    body: "Thank you. I approve the proposal.",
    tone: "professional",
    length: "short",
    confidence: 0.9,
    usedFacts: ["approve the proposal"],
    uncertainPoints: [],
    warnings: [],
    evidence: [],
  };

  it("uses copy-only structured output settings without provider storage", async () => {
    mocks.parse.mockResolvedValue({
      id: "resp_reply",
      output_parsed: draft,
      usage: { input_tokens: 80, output_tokens: 30 },
    });
    const result = await draftWithOpenAI(
      "<thread_data>{}</thread_data>",
      "safe-user-hash",
    );
    const request = mocks.parse.mock.calls[0]?.[0];
    expect(request).toMatchObject({
      model: "account-model",
      store: false,
      parallel_tool_calls: false,
      safety_identifier: "safe-user-hash",
      metadata: { prompt_version: "draft-reply-v2", schema_version: "1" },
    });
    expect(request.instructions).toMatch(/never claim the reply was sent/i);
    expect(request.text.format).toMatchObject({
      type: "json_schema",
      strict: true,
    });
    expect(result).toMatchObject({
      output: draft,
      responseId: "resp_reply",
      model: "account-model",
      inputTokens: 80,
      outputTokens: 30,
    });
  });

  it("maps reply timeouts to a stable reply-specific error", async () => {
    mocks.parse.mockRejectedValue(
      new mocks.APIConnectionTimeoutError("private"),
    );
    await expect(
      draftWithOpenAI("<thread_data>{}</thread_data>", "safe-user-hash"),
    ).rejects.toMatchObject({ code: "MODEL_TIMEOUT", status: 504 });
  });
});
