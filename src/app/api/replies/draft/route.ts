import { randomUUID } from "node:crypto";
import { failure, ok } from "@/lib/api-response";
import { AppError } from "@/lib/errors";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DRAFT_REPLY_PROMPT_VERSION } from "@/prompts/versions";
import { replyDraftInputSchema } from "@/schemas/reply-draft";
import { draftWithOpenAI } from "@/server/ai/openai-service";
import { requireCurrentUser } from "@/server/auth/current-user";
import { enforceRateLimit } from "@/server/rate-limit/limiter";
import { createDemoDraft, getDemoThread } from "@/server/services/demo-store";
export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    enforceRateLimit(user.id, "reply-draft", 5, 60_000);
    const input = replyDraftInputSchema.parse(await request.json());
    if (user.demo) {
      if (!getDemoThread(input.threadId))
        throw new AppError(
          "THREAD_NOT_FOUND",
          "The requested email thread was not found.",
          404,
        );
      return ok(createDemoDraft(input.threadId, input.tone, input.length), {
        demo: true,
        warning: "Draft only. Inb0x never sends email.",
      });
    }
    const db = createSupabaseAdminClient();
    const { data: thread } = await db
      .from("email_threads")
      .select("id,normalized_text")
      .eq("id", input.threadId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!thread?.normalized_text)
      throw new AppError(
        "THREAD_NOT_FOUND",
        "The requested email thread was not found.",
        404,
      );
    const result = await draftWithOpenAI(
      thread.normalized_text,
      JSON.stringify({
        tone: input.tone,
        length: input.length,
        instructions: input.instructions ?? "",
      }),
    );
    const id = randomUUID();
    await db.from("reply_drafts").insert({
      id,
      user_id: user.id,
      email_thread_id: thread.id,
      tone: input.tone,
      length: input.length,
      instructions: input.instructions ?? null,
      subject: result.output.subject,
      body: result.output.body,
      model: "configured",
      prompt_version: DRAFT_REPLY_PROMPT_VERSION,
      response_id: result.responseId,
      confidence: result.output.confidence,
    });
    return ok(
      {
        id,
        threadId: thread.id,
        tone: input.tone,
        length: input.length,
        ...result.output,
        isDraftOnly: true as const,
      },
      { warning: "Draft only. Inb0x never sends email." },
    );
  } catch (error) {
    return failure(error);
  }
}
