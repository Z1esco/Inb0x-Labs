import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { ZodError } from "zod";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { ANALYZE_THREAD_SYSTEM_PROMPT } from "@/prompts/analyze-thread";
import {
  ANALYZE_THREAD_PROMPT_VERSION,
  DRAFT_REPLY_PROMPT_VERSION,
  OUTPUT_SCHEMA_VERSION,
  REPLY_SCHEMA_VERSION,
} from "@/prompts/versions";
import { DRAFT_REPLY_SYSTEM_PROMPT } from "@/prompts/draft-reply";
import { emailAnalysisSchema } from "@/schemas/email-analysis";
import { replyDraftOutputSchema } from "@/schemas/reply-draft";

function client() {
  const env = getEnvironment();
  return new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    timeout: env.OPENAI_TIMEOUT_MS,
    maxRetries: env.OPENAI_MAX_RETRIES,
  });
}
function mapOpenAIAnalysisError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (
    error instanceof ZodError ||
    (error instanceof Error &&
      ["LengthFinishReasonError", "ContentFilterFinishReasonError"].includes(
        error.constructor.name,
      ))
  )
    return new AppError(
      "MODEL_OUTPUT_INVALID",
      "The model did not return a valid analysis.",
      502,
    );
  if (error instanceof OpenAI.RateLimitError)
    return new AppError(
      "RATE_LIMITED",
      "The analysis service is temporarily rate limited.",
      429,
    );
  if (error instanceof OpenAI.APIConnectionTimeoutError)
    return new AppError(
      "ANALYSIS_FAILED",
      "The analysis request timed out. Please try again.",
      504,
    );
  return new AppError(
    "ANALYSIS_FAILED",
    "Email analysis could not be completed.",
    502,
  );
}

export async function analyzeWithOpenAI(
  formattedThread: string,
  safetyIdentifier: string,
) {
  const env = getEnvironment();
  if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL)
    throw new AppError(
      "ANALYSIS_FAILED",
      "OpenAI analysis is not configured.",
      503,
    );
  try {
    const response = await client().responses.parse({
      model: env.OPENAI_MODEL,
      instructions: ANALYZE_THREAD_SYSTEM_PROMPT,
      input: [{ role: "user", content: formattedThread }],
      reasoning: { effort: env.OPENAI_REASONING_EFFORT },
      text: { format: zodTextFormat(emailAnalysisSchema, "email_analysis") },
      max_output_tokens: 4_000,
      parallel_tool_calls: false,
      store: false,
      safety_identifier: safetyIdentifier,
      metadata: {
        prompt_version: ANALYZE_THREAD_PROMPT_VERSION,
        schema_version: OUTPUT_SCHEMA_VERSION,
      },
    });
    if (!response.output_parsed)
      throw new AppError(
        "MODEL_OUTPUT_INVALID",
        "The model did not return a valid analysis.",
        502,
      );
    return {
      output: response.output_parsed,
      responseId: response.id,
      // Persist the configured cache identity. Provider aliases can resolve to a
      // dated model name, which must not turn every later lookup into a miss.
      model: env.OPENAI_MODEL,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    };
  } catch (error) {
    throw mapOpenAIAnalysisError(error);
  }
}
export async function draftWithOpenAI(
  formattedInput: string,
  safetyIdentifier: string,
) {
  const env = getEnvironment();
  if (!env.OPENAI_API_KEY || !env.OPENAI_MODEL)
    throw new AppError(
      "OPENAI_NOT_CONFIGURED",
      "Reply generation is not configured.",
      503,
    );
  try {
    const response = await client().responses.parse({
      model: env.OPENAI_MODEL,
      instructions: DRAFT_REPLY_SYSTEM_PROMPT,
      input: [{ role: "user", content: formattedInput }],
      reasoning: { effort: env.OPENAI_REASONING_EFFORT },
      text: { format: zodTextFormat(replyDraftOutputSchema, "reply_draft") },
      max_output_tokens: 3_000,
      parallel_tool_calls: false,
      store: false,
      safety_identifier: safetyIdentifier,
      metadata: {
        prompt_version: DRAFT_REPLY_PROMPT_VERSION,
        schema_version: REPLY_SCHEMA_VERSION,
      },
    });
    if (!response.output_parsed)
      throw new AppError(
        "MODEL_OUTPUT_INVALID",
        "The model did not return a valid reply draft.",
        502,
      );
    return {
      output: response.output_parsed,
      responseId: response.id,
      model: env.OPENAI_MODEL,
      inputTokens: response.usage?.input_tokens ?? null,
      outputTokens: response.usage?.output_tokens ?? null,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (
      error instanceof ZodError ||
      (error instanceof Error &&
        ["LengthFinishReasonError", "ContentFilterFinishReasonError"].includes(
          error.constructor.name,
        ))
    )
      throw new AppError(
        "MODEL_OUTPUT_INVALID",
        "The model did not return a valid reply draft.",
        502,
      );
    if (error instanceof OpenAI.RateLimitError)
      throw new AppError(
        "RATE_LIMITED",
        "Reply generation is temporarily rate limited.",
        429,
      );
    if (error instanceof OpenAI.APIConnectionTimeoutError)
      throw new AppError(
        "MODEL_TIMEOUT",
        "Reply generation timed out. Please try again.",
        504,
      );
    throw new AppError(
      "REPLY_GENERATION_FAILED",
      "The reply draft could not be generated.",
      502,
    );
  }
}
