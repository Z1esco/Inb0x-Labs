import { sha256 } from "@/lib/hashing";
import type {
  CreateReplyDraftRequest,
  EmailThreadDetail,
  ReplyDraft,
  ReplyDraftFilters,
} from "@/types/contracts";

const drafts = new Map<string, ReplyDraft>();
const suspiciousInstructions =
  /ignore|system prompt|api key|send (?:it|the email)|delete|password|secret/i;

function cacheId(input: CreateReplyDraftRequest, contentHash: string): string {
  return `demo-reply-${sha256(JSON.stringify({ ...input, force: false, contentHash })).slice(0, 24)}`;
}

function bodyFor(input: CreateReplyDraftRequest): string {
  const opening =
    input.tone === "warm"
      ? "Thank you for reaching out."
      : input.tone === "direct"
        ? "Thanks for the message."
        : input.tone === "professional"
          ? "Thank you for your message."
          : "Thanks for the update.";
  const core =
    "I understand the request and would like to confirm the next step.";
  const detail =
    input.length === "detailed"
      ? " Please share any remaining details needed so I can respond accurately without making assumptions."
      : input.length === "medium"
        ? " Please let me know if you need any additional information."
        : "";
  const instruction =
    input.instructions && !suspiciousInstructions.test(input.instructions)
      ? `\n\nRequested note: ${input.instructions}`
      : "";
  return `${opening} ${core}${detail}${instruction}`;
}

export function createDemoReply(
  thread: EmailThreadDetail,
  input: CreateReplyDraftRequest,
): { draft: ReplyDraft; cached: boolean } {
  const id = cacheId(input, thread.contentHash);
  if (!input.force) {
    const cached = drafts.get(id);
    if (cached) return { draft: cached, cached: true };
  }
  const source = thread.messages.at(-1);
  const excerpt = source?.body.trim().slice(0, 180) ?? "";
  const warnings = [
    ...(thread.containsPotentialPromptInjection
      ? ["The source thread contains a possible prompt-injection attempt."]
      : []),
  ];
  if (input.instructions && suspiciousInstructions.test(input.instructions))
    warnings.push("Unsafe or action-taking user instructions were ignored.");
  const now = new Date().toISOString();
  const draft: ReplyDraft = {
    id,
    threadId: thread.id,
    analysisId: thread.analysisId,
    subject: `Re: ${thread.subject.replace(/^(\s*re\s*:\s*)+/i, "")}`,
    body: bodyFor(input),
    tone: input.tone,
    length: input.length,
    confidence: thread.containsPotentialPromptInjection ? 0.65 : 0.88,
    usedFacts: excerpt ? [excerpt] : [],
    uncertainPoints: [],
    warnings,
    evidence:
      source && excerpt
        ? [
            {
              claim: "The draft responds to the latest message.",
              sourceMessageId: source.id,
              excerpt,
            },
          ]
        : [],
    createdAt: now,
    updatedAt: now,
    copyOnly: true,
    sent: false,
    isDraftOnly: true,
  };
  drafts.set(id, draft);
  return { draft, cached: false };
}

export function listDemoReplies(filters: ReplyDraftFilters) {
  const all = [...drafts.values()].filter(
    (draft) =>
      (!filters.threadId || draft.threadId === filters.threadId) &&
      (!filters.tone || draft.tone === filters.tone) &&
      (!filters.length || draft.length === filters.length),
  );
  all.sort((a, b) => {
    const field = filters.sort === "updated_desc" ? "updatedAt" : "createdAt";
    const direction = filters.sort === "created_asc" ? 1 : -1;
    return a[field].localeCompare(b[field]) * direction;
  });
  const offset = filters.cursor ? Number.parseInt(filters.cursor, 10) : 0;
  const safeOffset = Number.isSafeInteger(offset) && offset >= 0 ? offset : 0;
  const page = all.slice(safeOffset, safeOffset + filters.limit);
  const nextOffset = safeOffset + page.length;
  return {
    drafts: page,
    total: all.length,
    nextCursor: nextOffset < all.length ? String(nextOffset) : null,
  };
}

export function getDemoReply(id: string): ReplyDraft | null {
  return drafts.get(id) ?? null;
}

export function deleteDemoReply(id: string): boolean {
  return drafts.delete(id);
}

export function resetDemoReplies(): void {
  drafts.clear();
}
