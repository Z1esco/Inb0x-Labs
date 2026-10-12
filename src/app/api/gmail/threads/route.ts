import type { NextRequest } from "next/server";
import { failure, ok } from "@/lib/api-response";
import { gmailThreadListQuerySchema } from "@/schemas/api";
import { requireCurrentUser } from "@/server/auth/current-user";
import { listPersistedThreads } from "@/server/gmail/service";
import { listDemoThreadsPage } from "@/server/services/demo-store";

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const input = gmailThreadListQuerySchema.parse(
      Object.fromEntries(request.nextUrl.searchParams.entries()),
    );
    const result = user.demo
      ? listDemoThreadsPage({
          limit: input.limit,
          pageToken: input.pageToken,
          query: input.q,
          category: input.category,
          priority: input.priority,
          needsReply: input.needsReply,
        })
      : await listPersistedThreads(user.id, {
          limit: input.limit,
          pageToken: input.pageToken,
          query: input.q,
          category: input.category,
          priority: input.priority,
          needsReply: input.needsReply,
        });
    return ok(result.threads, {
      demo: user.demo,
      nextPageToken: result.nextPageToken,
      connected: true,
    });
  } catch (error) {
    return failure(error);
  }
}
