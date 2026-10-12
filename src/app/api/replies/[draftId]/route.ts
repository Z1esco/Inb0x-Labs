import { failure, ok } from "@/lib/api-response";
import { replyDraftIdSchema } from "@/schemas/reply-draft";
import { requireCurrentUser } from "@/server/auth/current-user";
import { enforceRateLimit } from "@/server/rate-limit/limiter";
import {
  deleteReplyDraft,
  getReplyDraft,
} from "@/server/replies/reply-service";

interface RouteContext {
  params: Promise<{ draftId: string }>;
}

async function draftId(context: RouteContext): Promise<string> {
  return replyDraftIdSchema.parse((await context.params).draftId);
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    return ok(await getReplyDraft(user, await draftId(context)), {
      demo: user.demo,
      copyOnly: true,
    });
  } catch (error) {
    return failure(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const user = await requireCurrentUser();
    enforceRateLimit(user.id, "reply-delete", 30, 60_000);
    return ok(await deleteReplyDraft(user, await draftId(context)), {
      demo: user.demo,
      copyOnly: true,
    });
  } catch (error) {
    return failure(error);
  }
}
