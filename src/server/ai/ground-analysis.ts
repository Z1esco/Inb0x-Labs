import { emailAnalysisSchema } from "@/schemas/email-analysis";
import type { AnalysisPromptMessage } from "@/prompts/analyze-thread";
import type { EmailAnalysis } from "@/types/contracts";

function canonical(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase();
}

export function evidenceAppearsInMessage(
  messages: readonly AnalysisPromptMessage[],
  sourceMessageId: string,
  excerpt: string,
): boolean {
  const message = messages.find((item) => item.id === sourceMessageId);
  if (!message || !excerpt.trim()) return false;
  return canonical(message.body).includes(canonical(excerpt));
}

export function groundAnalysisOutput(
  candidate: unknown,
  messages: readonly AnalysisPromptMessage[],
  containsPotentialPromptInjection: boolean,
): EmailAnalysis {
  const parsed = emailAnalysisSchema.parse(candidate);
  let removedUnsupportedClaim = false;
  const grounded = <T extends { sourceMessageId: string; evidence: string }>(
    values: readonly T[],
  ): T[] =>
    values.filter((value) => {
      const valid = evidenceAppearsInMessage(
        messages,
        value.sourceMessageId,
        value.evidence,
      );
      if (!valid) removedUnsupportedClaim = true;
      return valid;
    });

  const evidence = parsed.evidence.filter((item) => {
    const valid = evidenceAppearsInMessage(
      messages,
      item.sourceMessageId,
      item.excerpt,
    );
    if (!valid) removedUnsupportedClaim = true;
    return valid;
  });
  const safetyFlags = [...parsed.safetyFlags];
  if (
    containsPotentialPromptInjection &&
    !safetyFlags.includes("possible_prompt_injection")
  )
    safetyFlags.push("possible_prompt_injection");
  if (removedUnsupportedClaim && !safetyFlags.includes("other"))
    safetyFlags.push("other");

  return emailAnalysisSchema.parse({
    ...parsed,
    confidence: removedUnsupportedClaim
      ? Math.min(parsed.confidence, 0.5)
      : parsed.confidence,
    deadlines: grounded(parsed.deadlines),
    actionItems: grounded(parsed.actionItems),
    meetings: grounded(parsed.meetings),
    evidence,
    safetyFlags: safetyFlags.slice(0, 10),
  });
}
