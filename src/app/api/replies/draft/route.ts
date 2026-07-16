import { failure, ok } from "@/lib/api-response";
import { replyDraftInputSchema } from "@/schemas/reply-draft";
import { requireCurrentUser } from "@/server/auth/current-user";
import { enforceRateLimit } from "@/server/rate-limit/limiter";
import { createReplyDraft } from "@/server/replies/reply-service";

export async function POST(request: Request) {
  try {
    const user = await requireCurrentUser();
    const input = replyDraftInputSchema.parse(await request.json());
    enforceRateLimit(
      user.id,
      input.force ? "reply-force" : "reply-draft",
      5,
      60_000,
    );
    const result = await createReplyDraft(user, input);
    return ok(
      result.draft,
      {
        cached: result.cached,
        usage: result.usage,
        demo: user.demo,
        copyOnly: true,
        warning: "Draft only. Inb0x never sends email.",
      },
      201,
    );
  } catch (error) {
    return failure(error);
  }
}
