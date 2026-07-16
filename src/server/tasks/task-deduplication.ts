import { sha256 } from "@/lib/hashing";

function normalizeKeyPart(value: string | null): string {
  return (value ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function createSourceActionKey(input: {
  userId: string;
  analysisId: string;
  sourceMessageId: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  evidence: string;
}): string {
  return sha256(
    [
      input.userId,
      input.analysisId,
      input.sourceMessageId,
      normalizeKeyPart(input.title),
      normalizeKeyPart(input.description),
      input.dueAt ?? "",
      normalizeKeyPart(input.evidence),
    ].join("\u001f"),
  );
}
