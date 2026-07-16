import { convert } from "html-to-text";
import type { gmail_v1 } from "googleapis";
import { sha256 } from "@/lib/hashing";

export function decodeBase64Url(value: string): string {
  try {
    return Buffer.from(
      value.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
  } catch {
    return "";
  }
}
function bodyFromPart(part: gmail_v1.Schema$MessagePart | undefined): {
  text: string;
  hasAttachments: boolean;
} {
  if (!part) return { text: "", hasAttachments: false };
  const attachment = Boolean(part.filename || part.body?.attachmentId);
  if (part.mimeType === "text/plain" && part.body?.data)
    return {
      text: decodeBase64Url(part.body.data),
      hasAttachments: attachment,
    };
  const children = (part.parts ?? []).map(bodyFromPart);
  const plain = children.find(
    (item, index) =>
      part.parts?.[index]?.mimeType === "text/plain" && item.text,
  );
  if (plain)
    return {
      text: plain.text,
      hasAttachments:
        attachment || children.some((item) => item.hasAttachments),
    };
  if (part.mimeType === "text/html" && part.body?.data)
    return {
      text: convert(decodeBase64Url(part.body.data), {
        selectors: [
          { selector: "img", format: "skip" },
          { selector: "script", format: "skip" },
          { selector: "style", format: "skip" },
        ],
      }),
      hasAttachments: attachment,
    };
  return {
    text: children
      .map((item) => item.text)
      .filter(Boolean)
      .join("\n"),
    hasAttachments: attachment || children.some((item) => item.hasAttachments),
  };
}
function header(message: gmail_v1.Schema$Message, name: string): string {
  return (
    message.payload?.headers?.find(
      (item) => item.name?.toLowerCase() === name.toLowerCase(),
    )?.value ?? ""
  );
}
export interface NormalizedThread {
  gmailThreadId: string;
  subject: string;
  participants: string[];
  senderNames: string[];
  messageCount: number;
  latestMessageAt: string;
  snippet: string;
  normalizedText: string;
  contentHash: string;
  hasAttachments: boolean;
  gmailLabels: string[];
}
export function normalizeGmailThread(
  value: gmail_v1.Schema$Thread,
  maxCharacters = 12_000,
): NormalizedThread {
  const messages = [...(value.messages ?? [])].sort(
    (a, b) => Number(a.internalDate ?? 0) - Number(b.internalDate ?? 0),
  );
  const parts = messages.map((message) => ({
    message,
    body: bodyFromPart(message.payload ?? undefined),
  }));
  const normalizedText = parts
    .map(
      ({ message, body }) =>
        `From: ${header(message, "from")}\nDate: ${header(message, "date")}\n${body.text.trim()}`,
    )
    .join("\n\n---\n\n")
    .slice(0, maxCharacters);
  const participants = [
    ...new Set(
      messages
        .flatMap((message) => [header(message, "from"), header(message, "to")])
        .filter(Boolean),
    ),
  ];
  const latest = messages.at(-1);
  const latestMs = Number(latest?.internalDate ?? Date.now());
  return {
    gmailThreadId: value.id ?? "",
    subject: header(latest ?? {}, "subject") || "(No subject)",
    participants,
    senderNames: participants.map((item) => item.split("<")[0]?.trim() || item),
    messageCount: messages.length,
    latestMessageAt: new Date(latestMs).toISOString(),
    snippet: latest?.snippet ?? normalizedText.slice(0, 160),
    normalizedText,
    contentHash: sha256(normalizedText),
    hasAttachments: parts.some((item) => item.body.hasAttachments),
    gmailLabels: [
      ...new Set(messages.flatMap((message) => message.labelIds ?? [])),
    ],
  };
}
