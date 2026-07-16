import type { NextRequest } from "next/server";
import { failure, ok } from "@/lib/api-response";
import { gmailSyncInputSchema } from "@/schemas/api";
import { requireCurrentUser } from "@/server/auth/current-user";
import { synchronizeGmailThreads } from "@/server/gmail/service";
import { enforceRateLimit } from "@/server/rate-limit/limiter";
import type { GmailSyncResult } from "@/types/contracts";

export async function POST(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    enforceRateLimit(user.id, "gmail-sync", 3, 60_000);
    const rawBody = await request.text();
    const body = rawBody ? JSON.parse(rawBody) : {};
    const input = gmailSyncInputSchema.parse(body);
    if (user.demo) {
      const syncedAt = "2026-07-16T00:00:00.000Z";
      const result: GmailSyncResult = {
        requested: 0,
        fetched: 0,
        created: 0,
        updated: 0,
        unchanged: 12,
        failed: 0,
        nextPageToken: null,
        syncedAt,
      };
      return ok(result, { demo: true });
    }
    return ok(await synchronizeGmailThreads(user.id, input));
  } catch (error) {
    return failure(error);
  }
}
