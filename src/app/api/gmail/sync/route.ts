import { failure, ok } from "@/lib/api-response";
import { getEnvironment } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireCurrentUser } from "@/server/auth/current-user";
import { loadGoogleCredentials } from "@/server/gmail/connection-service";
import {
  getNormalizedGmailThread,
  listRecentGmailThreads,
} from "@/server/gmail/service";
import { enforceRateLimit } from "@/server/rate-limit/limiter";
import { getRealSettings } from "@/server/services/real-data";
export async function POST() {
  try {
    const user = await requireCurrentUser();
    enforceRateLimit(user.id, "gmail-sync", 3, 60_000);
    if (user.demo)
      return ok(
        { synchronized: 0, message: "Demo inbox is already seeded." },
        { demo: true },
      );
    const credentials = await loadGoogleCredentials(user.id);
    const settings = await getRealSettings(user.id);
    const listed = await listRecentGmailThreads(
      credentials,
      settings.gmailLookbackDays,
      settings.gmailMaxThreads,
    );
    const ids = (listed.threads ?? []).flatMap((item) =>
      item.id ? [item.id] : [],
    );
    const db = createSupabaseAdminClient();
    let synchronized = 0;
    for (let index = 0; index < ids.length; index += 5) {
      const batch = ids.slice(index, index + 5);
      const threads = await Promise.all(
        batch.map((id) =>
          getNormalizedGmailThread(
            credentials,
            id,
            getEnvironment().THREAD_MAX_CHARACTERS,
          ),
        ),
      );
      const rows = threads.map((thread) => ({
        user_id: user.id,
        gmail_thread_id: thread.gmailThreadId,
        subject: thread.subject,
        participants: thread.participants,
        sender_names: thread.senderNames,
        message_count: thread.messageCount,
        latest_message_at: thread.latestMessageAt,
        snippet: thread.snippet,
        normalized_text: thread.normalizedText,
        content_hash: thread.contentHash,
        has_attachments: thread.hasAttachments,
        gmail_labels: thread.gmailLabels,
        synced_at: new Date().toISOString(),
      }));
      const { error } = await db
        .from("email_threads")
        .upsert(rows, { onConflict: "user_id,gmail_thread_id" });
      if (error) throw error;
      synchronized += rows.length;
    }
    await db
      .from("gmail_connections")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("user_id", user.id);
    return ok({ synchronized });
  } catch (error) {
    return failure(error);
  }
}
