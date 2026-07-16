import { AppError } from "@/lib/errors";
import { replyDraftOutputSchema } from "@/schemas/reply-draft";
import type { ReplyDraft } from "@/types/contracts";

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function mapReplyRow(row: Record<string, unknown>): ReplyDraft {
  const output = replyDraftOutputSchema.safeParse({
    subject: row.subject,
    body: row.body,
    tone: row.tone,
    length: row.length,
    confidence: row.confidence,
    usedFacts: row.used_facts,
    uncertainPoints: row.uncertain_points,
    warnings: row.warnings,
    evidence: row.evidence,
  });
  if (!output.success)
    throw new AppError(
      "INTERNAL_ERROR",
      "Stored reply draft data is invalid.",
      500,
    );
  return {
    id: String(row.id),
    threadId: String(row.email_thread_id),
    analysisId: nullableString(row.email_analysis_id),
    ...output.data,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    copyOnly: true,
    sent: false,
    isDraftOnly: true,
  };
}
