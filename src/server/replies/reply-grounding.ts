import { AppError } from "@/lib/errors";
import { replyDraftOutputSchema } from "@/schemas/reply-draft";
import type { ReplyLength, ReplyTone } from "@/types/contracts";

export interface GroundingMessage {
  id: string;
  body: string;
  subject: string;
  attachments: Array<{ filename: string }>;
}

function normalized(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isSupported(value: string, source: string): boolean {
  const needle = normalized(value);
  return needle.length > 0 && normalized(source).includes(needle);
}

const highRiskClaimPatterns = [
  /\b(?:i|we)\s+(?:have\s+)?(?:paid|completed|sent|signed|approved|reviewed|attached|booked|scheduled)\b/i,
  /\bpayment\s+(?:was|has been)\s+(?:made|completed|sent)\b/i,
  /\b(?:i am|i'm|we are|we're)\s+available\b/i,
];

export function normalizeReplySubject(
  subject: string,
  fallback: string,
): string {
  const source = subject.trim() || fallback.trim() || "Your message";
  const withoutPrefixes = source.replace(/^(\s*re\s*:\s*)+/i, "").trim();
  return `Re: ${withoutPrefixes || "Your message"}`.slice(0, 200);
}

export function groundReplyOutput(
  value: unknown,
  input: {
    tone: ReplyTone;
    length: ReplyLength;
    threadSubject: string;
    instructions?: string | undefined;
    containsPotentialPromptInjection: boolean;
    messages: GroundingMessage[];
  },
) {
  const parsed = replyDraftOutputSchema.parse(value);
  const messageById = new Map(
    input.messages.map((message) => [message.id, message]),
  );
  const sourceText = input.messages
    .map(
      (message) =>
        `${message.subject}\n${message.body}\n${message.attachments.map((item) => item.filename).join("\n")}`,
    )
    .join("\n");
  const instructionText = input.instructions ?? "";
  const supportText = `${sourceText}\n${instructionText}`;
  if (
    highRiskClaimPatterns.some(
      (pattern) => pattern.test(parsed.body) && !pattern.test(supportText),
    )
  )
    throw new AppError(
      "GROUNDING_FAILED",
      "The generated draft contained an unsupported commitment.",
      502,
    );
  const evidence = parsed.evidence.filter((item) => {
    const message = messageById.get(item.sourceMessageId);
    return Boolean(message && isSupported(item.excerpt, message.body));
  });
  const usedFacts = parsed.usedFacts.filter(
    (fact) =>
      isSupported(fact, sourceText) || isSupported(fact, instructionText),
  );
  const removed =
    evidence.length !== parsed.evidence.length ||
    usedFacts.length !== parsed.usedFacts.length;
  const warnings = [...parsed.warnings];
  if (removed)
    warnings.push("Unsupported model claims were removed during grounding.");
  if (input.containsPotentialPromptInjection)
    warnings.push(
      "The source thread contains a possible prompt-injection attempt.",
    );
  return replyDraftOutputSchema.parse({
    ...parsed,
    subject: normalizeReplySubject(input.threadSubject, parsed.subject),
    tone: input.tone,
    length: input.length,
    confidence: removed ? Math.min(parsed.confidence, 0.6) : parsed.confidence,
    usedFacts,
    evidence,
    warnings: [...new Set(warnings)].slice(0, 15),
  });
}
