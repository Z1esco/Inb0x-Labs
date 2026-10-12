import { failure, ok } from "@/lib/api-response";
import { replyDraftQuerySchema } from "@/schemas/reply-draft";
import { requireCurrentUser } from "@/server/auth/current-user";
import { listReplyDrafts } from "@/server/replies/reply-service";

export async function GET(request: Request) {
  try {
    const user = await requireCurrentUser();
    const filters = replyDraftQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const result = await listReplyDrafts(user, filters);
    return ok(
      { drafts: result.drafts },
      {
        demo: user.demo,
        copyOnly: true,
        pagination: {
          nextCursor: result.nextCursor,
          limit: filters.limit,
          total: result.total,
        },
      },
    );
  } catch (error) {
    return failure(error);
  }
}
