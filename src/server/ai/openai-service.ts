import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { ANALYZE_THREAD_SYSTEM_PROMPT } from "@/prompts/analyze-thread";
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
export async function analyzeWithOpenAI(normalizedThread: string) {
  const env = getEnvironment();
  if (!env.OPENAI_MODEL)
    throw new AppError(
      "ANALYSIS_FAILED",
      "OpenAI model is not configured.",
      503,
    );
  const response = await client().responses.parse({
    model: env.OPENAI_MODEL,
    reasoning: { effort: env.OPENAI_REASONING_EFFORT },
    input: [
      { role: "system", content: ANALYZE_THREAD_SYSTEM_PROMPT },
      {
        role: "user",
        content: normalizedThread.slice(0, env.THREAD_MAX_CHARACTERS),
      },
    ],
    text: { format: zodTextFormat(emailAnalysisSchema, "email_analysis") },
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
    model: env.OPENAI_MODEL,
    inputTokens: response.usage?.input_tokens ?? null,
    outputTokens: response.usage?.output_tokens ?? null,
  };
}
export async function draftWithOpenAI(
  normalizedThread: string,
  instructions: string,
) {
  const env = getEnvironment();
  if (!env.OPENAI_MODEL)
    throw new AppError(
      "ANALYSIS_FAILED",
      "OpenAI model is not configured.",
      503,
    );
  const response = await client().responses.parse({
    model: env.OPENAI_MODEL,
    reasoning: { effort: env.OPENAI_REASONING_EFFORT },
    input: [
      { role: "system", content: DRAFT_REPLY_SYSTEM_PROMPT },
      {
        role: "user",
        content: `${normalizedThread.slice(0, env.THREAD_MAX_CHARACTERS)}\n\nUser preferences: ${instructions}`,
      },
    ],
    text: { format: zodTextFormat(replyDraftOutputSchema, "reply_draft") },
  });
  if (!response.output_parsed)
    throw new AppError(
      "MODEL_OUTPUT_INVALID",
      "The model did not return a valid draft.",
      502,
    );
  return { output: response.output_parsed, responseId: response.id };
}
