import { convert } from "html-to-text";
import type { gmail_v1 } from "googleapis";
import { sha256 } from "@/lib/hashing";
import type {
  AttachmentMetadata,
  EmailMessage,
  EmailParticipant,
} from "@/types/contracts";

const FALLBACK_DATE = "1970-01-01T00:00:00.000Z";
const MAX_RAW_TEXT_BYTES = 1_000_000;
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?previous\s+instructions/i,
  /reveal\s+(?:your\s+)?system\s+prompt/i,
  /(?:send|show|reveal|return)\s+(?:all\s+)?(?:stored\s+)?(?:tokens|secrets|credentials)/i,
] as const;

interface ExtractedPart {
  text: string;
  rank: 0 | 1 | 2;
  attachments: AttachmentMetadata[];
  trimmed: boolean;
}

interface ParsedMessage {
  message: EmailMessage;
  from: EmailParticipant | null;
  to: EmailParticipant[];
  cc: EmailParticipant[];
  replyTo: EmailParticipant | null;
  messageIdHeader: string | null;
  inReplyTo: string | null;
  references: string[];
  labels: string[];
  timestamp: number;
}

export interface NormalizedThread {
  gmailThreadId: string;
  gmailHistoryId: string | null;
  subject: string;
  participants: string[];
  senderNames: string[];
  messageCount: number;
  latestMessageAt: string;
  snippet: string;
  normalizedText: string;
  normalizedCharacterCount: number;
  contentHash: string;
  hasAttachments: boolean;
  gmailLabels: string[];
  messages: EmailMessage[];
  trimmed: boolean;
  containsPotentialPromptInjection: boolean;
}

function decodeBase64UrlBytes(value: string): Buffer | null {
  const compact = value.replace(/\s/g, "");
  if (!compact) return Buffer.alloc(0);
  if (!/^[A-Za-z0-9_-]+={0,2}$/.test(compact)) return null;
  const unpadded = compact.replace(/=+$/, "");
  if (unpadded.length % 4 === 1) return null;
  const standard = unpadded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = standard.padEnd(
    standard.length + ((4 - (standard.length % 4)) % 4),
    "=",
  );
  try {
    return Buffer.from(padded, "base64");
  } catch {
    return null;
  }
}

export function decodeBase64Url(value: string): string {
  const bytes = decodeBase64UrlBytes(value);
  if (!bytes) return "";
  return bytes.toString("utf8");
}

function partHeader(part: gmail_v1.Schema$MessagePart, name: string): string {
  return (
    part.headers?.find(
      (item) => item.name?.toLowerCase() === name.toLowerCase(),
    )?.value ?? ""
  );
}

function charsetFromPart(part: gmail_v1.Schema$MessagePart): string {
  const contentType = partHeader(part, "content-type");
  const match = /charset\s*=\s*["']?([^;"'\s]+)/i.exec(contentType);
  return match?.[1]?.trim() || "utf-8";
}

function decodePartBody(part: gmail_v1.Schema$MessagePart): {
  text: string;
  trimmed: boolean;
} {
  const encoded = part.body?.data;
  if (!encoded) return { text: "", trimmed: false };
  const bytes = decodeBase64UrlBytes(encoded);
  if (!bytes) return { text: "", trimmed: false };
  const bounded = bytes.subarray(0, MAX_RAW_TEXT_BYTES);
  const trimmed = bounded.length < bytes.length;
  try {
    return {
      text: new TextDecoder(charsetFromPart(part), { fatal: false }).decode(
        bounded,
      ),
      trimmed,
    };
  } catch {
    return {
      text: new TextDecoder("utf-8", { fatal: false }).decode(bounded),
      trimmed,
    };
  }
}

function stripUnsafeHtml(value: string): string {
  return value
    .replace(/<!--([\s\S]*?)-->/g, "")
    .replace(
      /<(script|style|svg|noscript|template|head)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,
      "",
    )
    .replace(
      /<([a-z][\w:-]*)\b[^>]*(?:\bhidden\b|aria-hidden\s*=\s*["']?true|style\s*=\s*["'][^"']*(?:display\s*:\s*none|visibility\s*:\s*hidden)[^"']*)[^>]*>[\s\S]*?<\/\1\s*>/gi,
      "",
    )
    .replace(
      /<(blockquote|div)\b[^>]*class\s*=\s*["'][^"']*(?:gmail_quote|gmail_extra)[^"']*["'][^>]*>[\s\S]*?<\/\1\s*>/gi,
      "",
    );
}

export function htmlToSafeText(value: string): string {
  if (!value) return "";
  return normalizeWhitespace(
    convert(stripUnsafeHtml(value), {
      wordwrap: false,
      selectors: [
        { selector: "img", format: "skip" },
        { selector: "script", format: "skip" },
        { selector: "style", format: "skip" },
        { selector: "svg", format: "skip" },
        { selector: "a", options: { ignoreHref: true } },
      ],
    }),
  );
}

export function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/\u00a0/g, " ")
    .split("\n")
    .map((line) => line.replace(/[\t ]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function trimQuotedHistory(value: string): {
  text: string;
  trimmed: boolean;
} {
  const text = normalizeWhitespace(value);
  if (!text) return { text: "", trimmed: false };
  const lines = text.split("\n");
  let cutoff = lines.length;
  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? "";
    if (
      /^On .{3,200} wrote:$/i.test(line) ||
      /^-{2,}\s*(?:Forwarded|Original) message\s*-{2,}$/i.test(line)
    ) {
      cutoff = index;
      break;
    }
  }

  let quoteStart = cutoff;
  while (quoteStart > 0 && /^\s*>/.test(lines[quoteStart - 1] ?? ""))
    quoteStart -= 1;
  if (cutoff - quoteStart >= 2) cutoff = quoteStart;

  const signatureStart = lines.findIndex(
    (line, index) =>
      index >= 2 &&
      (/^--\s*$/.test(line) ||
        /^(?:Sent from my (?:iPhone|iPad|Android)|Get Outlook for (?:iOS|Android))$/i.test(
          line.trim(),
        )),
  );
  if (signatureStart >= 2) cutoff = Math.min(cutoff, signatureStart);

  const trimmedText = normalizeWhitespace(lines.slice(0, cutoff).join("\n"));
  return { text: trimmedText, trimmed: trimmedText !== text };
}

export function containsPotentialPromptInjection(value: string): boolean {
  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(value));
}

function attachmentFromPart(
  part: gmail_v1.Schema$MessagePart,
): AttachmentMetadata | null {
  if (!part.filename && !part.body?.attachmentId) return null;
  return {
    filename: normalizeWhitespace(part.filename || "Unnamed attachment").slice(
      0,
      255,
    ),
    mimeType: (part.mimeType || "application/octet-stream").slice(0, 127),
    sizeBytes: Math.max(0, Number(part.body?.size ?? 0) || 0),
  };
}

function extractPart(
  part: gmail_v1.Schema$MessagePart | undefined,
): ExtractedPart {
  if (!part) return { text: "", rank: 0, attachments: [], trimmed: false };
  const attachment = attachmentFromPart(part);
  if (attachment)
    return {
      text: "",
      rank: 0,
      attachments: [attachment],
      trimmed: false,
    };

  const mimeType = (part.mimeType || "").toLowerCase();
  if (mimeType === "text/plain") {
    const decoded = decodePartBody(part);
    return {
      text: normalizeWhitespace(decoded.text),
      rank: 2,
      attachments: [],
      trimmed: decoded.trimmed,
    };
  }
  if (mimeType === "text/html") {
    const decoded = decodePartBody(part);
    return {
      text: htmlToSafeText(decoded.text),
      rank: 1,
      attachments: [],
      trimmed: decoded.trimmed,
    };
  }

  const children = (part.parts ?? []).map(extractPart);
  const attachments = children.flatMap((item) => item.attachments);
  if (mimeType === "multipart/alternative") {
    const preferred = children
      .filter((item) => item.text)
      .sort((left, right) => right.rank - left.rank)[0];
    return {
      text: preferred?.text ?? "",
      rank: preferred?.rank ?? 0,
      attachments,
      trimmed: children.some((item) => item.trimmed),
    };
  }
  return {
    text: normalizeWhitespace(
      children
        .map((item) => item.text)
        .filter(Boolean)
        .join("\n\n"),
    ),
    rank: children.reduce<0 | 1 | 2>(
      (highest, item) => (item.rank > highest ? item.rank : highest),
      0,
    ),
    attachments,
    trimmed: children.some((item) => item.trimmed),
  };
}

function messageHeader(message: gmail_v1.Schema$Message, name: string): string {
  return (
    message.payload?.headers?.find(
      (item) => item.name?.toLowerCase() === name.toLowerCase(),
    )?.value ?? ""
  );
}

export function parseAddressList(value: string): EmailParticipant[] {
  if (!value) return [];
  return value
    .split(/,(?=(?:[^"\\]*"[^"\\]*")*[^"\\]*$)/)
    .map((entry) => entry.replace(/[\r\n\0]/g, " ").trim())
    .flatMap((entry) => {
      if (!entry) return [];
      const bracket = /^(.*?)<\s*([^<>\s]+@[^<>\s]+)\s*>$/.exec(entry);
      const email = (bracket?.[2] ?? entry).replace(/^mailto:/i, "").trim();
      if (!/^[^\s@<>]+@[^\s@<>]+$/.test(email)) return [];
      const rawName = bracket?.[1]?.trim().replace(/^"|"$/g, "") ?? "";
      return [{ name: rawName || null, email: email.toLowerCase() }];
    });
}

function displayParticipant(value: EmailParticipant): string {
  return value.name ? `${value.name} <${value.email}>` : value.email;
}

function safeTimestamp(message: gmail_v1.Schema$Message): number {
  const internal = Number(message.internalDate);
  if (Number.isFinite(internal) && internal >= 0) return internal;
  const headerDate = Date.parse(messageHeader(message, "date"));
  return Number.isFinite(headerDate) ? headerDate : 0;
}

function parseMessage(message: gmail_v1.Schema$Message): ParsedMessage {
  const extracted = extractPart(message.payload ?? undefined);
  const quoteResult = trimQuotedHistory(extracted.text);
  const from = parseAddressList(messageHeader(message, "from"))[0] ?? null;
  const to = parseAddressList(messageHeader(message, "to"));
  const cc = parseAddressList(messageHeader(message, "cc"));
  const replyTo =
    parseAddressList(messageHeader(message, "reply-to"))[0] ?? null;
  const timestamp = safeTimestamp(message);
  const sentAt = new Date(timestamp).toISOString();
  const subject =
    normalizeWhitespace(messageHeader(message, "subject")) || "(No subject)";
  const body = quoteResult.text;
  return {
    message: {
      id: message.id ?? "",
      from: from ? displayParticipant(from) : "Unknown sender",
      to: to.map(displayParticipant),
      cc: cc.map(displayParticipant),
      replyTo: replyTo ? displayParticipant(replyTo) : null,
      sentAt,
      subject,
      body,
      mimeType: message.payload?.mimeType || "application/octet-stream",
      attachments: extracted.attachments,
      trimmed: quoteResult.trimmed || extracted.trimmed,
      containsPotentialPromptInjection: containsPotentialPromptInjection(body),
    },
    from,
    to,
    cc,
    replyTo,
    messageIdHeader: messageHeader(message, "message-id") || null,
    inReplyTo: messageHeader(message, "in-reply-to") || null,
    references: messageHeader(message, "references")
      .split(/\s+/)
      .filter(Boolean),
    labels: message.labelIds ?? [],
    timestamp,
  };
}

function canonicalText(value: string): string {
  return normalizeWhitespace(value).replace(/\s+/g, " ");
}

export function computeThreadContentHash(input: {
  threadId: string;
  subject: string;
  messages: Pick<EmailMessage, "id" | "sentAt" | "subject" | "body">[];
}): string {
  return sha256(
    JSON.stringify({
      threadId: input.threadId,
      subject: canonicalText(input.subject),
      messages: input.messages.map((message) => ({
        id: message.id,
        sentAt: message.sentAt,
        subject: canonicalText(message.subject),
        body: canonicalText(message.body),
      })),
    }),
  );
}

function deduplicateBodies(messages: EmailMessage[]): boolean {
  const seen = new Set<string>();
  let trimmed = false;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message) continue;
    const canonical = canonicalText(message.body);
    if (canonical && seen.has(canonical)) {
      message.body = "";
      message.trimmed = true;
      trimmed = true;
    } else if (canonical) {
      seen.add(canonical);
    }
  }
  return trimmed;
}

function capMessageBodies(
  messages: EmailMessage[],
  maxCharacters: number,
): boolean {
  let remaining = Math.max(0, maxCharacters);
  let trimmed = false;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message) continue;
    if (message.body.length > remaining) {
      message.body = message.body.slice(0, remaining).trimEnd();
      message.trimmed = true;
      trimmed = true;
    }
    remaining = Math.max(0, remaining - message.body.length);
  }
  return trimmed;
}

function normalizedSection(message: EmailMessage): string {
  return normalizeWhitespace(
    `From: ${message.from}\nTo: ${message.to.join(", ")}\nDate: ${message.sentAt}\nSubject: ${message.subject}\n\n${message.body}`,
  );
}

function buildBoundedNormalizedText(
  messages: EmailMessage[],
  maxCharacters: number,
): { text: string; trimmed: boolean } {
  const sections: string[] = [];
  let used = 0;
  let trimmed = false;
  const separator = "\n\n---\n\n";
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message) continue;
    const section = normalizedSection(message);
    const cost = section.length + (sections.length ? separator.length : 0);
    if (cost <= maxCharacters - used) {
      sections.unshift(section);
      used += cost;
      continue;
    }
    trimmed = true;
    if (sections.length === 0 && maxCharacters > 0) {
      sections.unshift(section.slice(0, maxCharacters));
      used = maxCharacters;
    }
  }
  return { text: sections.join(separator), trimmed };
}

export function normalizeGmailThread(
  value: gmail_v1.Schema$Thread,
  maxCharacters = 12_000,
): NormalizedThread {
  const parsed = (value.messages ?? [])
    .map(parseMessage)
    .sort(
      (left, right) =>
        left.timestamp - right.timestamp ||
        left.message.id.localeCompare(right.message.id),
    );
  const messages = parsed.map((item) => structuredClone(item.message));
  const deduplicated = deduplicateBodies(messages);
  const bodiesCapped = capMessageBodies(messages, Math.max(0, maxCharacters));
  const bounded = buildBoundedNormalizedText(
    messages,
    Math.max(0, maxCharacters),
  );
  const participantMap = new Map<string, EmailParticipant>();
  for (const item of parsed)
    for (const participant of [item.from, ...item.to, ...item.cc, item.replyTo])
      if (participant && !participantMap.has(participant.email))
        participantMap.set(participant.email, participant);
  const participants = [...participantMap.values()];
  const senderNames = [
    ...new Set(
      parsed.flatMap((item) =>
        item.from ? [item.from.name || item.from.email] : [],
      ),
    ),
  ];
  const latest = parsed.at(-1);
  const subject =
    [...parsed]
      .reverse()
      .map((item) => item.message.subject)
      .find((item) => item !== "(No subject)") ?? "(No subject)";
  const containsInjection = messages.some(
    (message) => message.containsPotentialPromptInjection,
  );
  const trimmed =
    deduplicated ||
    bodiesCapped ||
    bounded.trimmed ||
    messages.some((message) => message.trimmed);
  const gmailThreadId = value.id ?? "";
  const contentHash = computeThreadContentHash({
    threadId: gmailThreadId,
    subject,
    messages,
  });
  return {
    gmailThreadId,
    gmailHistoryId: value.historyId ?? null,
    subject,
    participants: participants.map(displayParticipant),
    senderNames,
    messageCount: messages.length,
    latestMessageAt: latest?.message.sentAt ?? FALLBACK_DATE,
    snippet: normalizeWhitespace(
      latest?.message.body || value.snippet || "",
    ).slice(0, 200),
    normalizedText: bounded.text,
    normalizedCharacterCount: bounded.text.length,
    contentHash,
    hasAttachments: messages.some((message) => message.attachments.length > 0),
    gmailLabels: [
      ...new Set(parsed.flatMap((item) => item.labels).filter(Boolean)),
    ],
    messages,
    trimmed,
    containsPotentialPromptInjection: containsInjection,
  };
}
