import { z } from "zod";

const boundedString = (maximum: number) =>
  z.string().trim().min(1).max(maximum);
const nullableString = (maximum: number) => boundedString(maximum).nullable();
const nullableDateTime = z.string().datetime({ offset: true }).nullable();
const confidence = z.number().min(0).max(1);
const evidenceExcerpt = boundedString(300);

export const deadlineSchema = z.strictObject({
  label: boundedString(200),
  dateTime: nullableDateTime,
  dateText: nullableString(200),
  timezone: nullableString(100),
  confidence,
  sourceMessageId: boundedString(200),
  evidence: evidenceExcerpt,
});

export const actionItemSchema = z.strictObject({
  title: boundedString(300),
  description: nullableString(500),
  assignee: z.enum(["user", "sender", "other", "unclear"]),
  dueAt: nullableDateTime,
  confidence,
  sourceMessageId: boundedString(200),
  evidence: evidenceExcerpt,
});

export const meetingSchema = z.strictObject({
  title: boundedString(300),
  startAt: nullableDateTime,
  endAt: nullableDateTime,
  location: nullableString(300),
  participants: z.array(boundedString(200)).max(20),
  confidence,
  sourceMessageId: boundedString(200),
  evidence: evidenceExcerpt,
});

export const analysisEvidenceSchema = z.strictObject({
  claim: boundedString(500),
  sourceMessageId: boundedString(200),
  excerpt: evidenceExcerpt,
});

export const analysisSafetyFlagSchema = z.enum([
  "possible_prompt_injection",
  "sensitive_information",
  "suspicious_link",
  "financial_request",
  "credential_request",
  "uncertain_date",
  "other",
]);

export const emailAnalysisSchema = z.strictObject({
  summary: boundedString(900),
  category: z.enum([
    "urgent",
    "work",
    "finance",
    "meeting",
    "personal",
    "newsletter",
    "promotion",
    "notification",
    "security",
    "other",
  ]),
  priorityScore: z.number().int().min(0).max(100),
  priorityLevel: z.enum(["critical", "high", "medium", "low"]),
  priorityReason: boundedString(500),
  needsReply: z.boolean(),
  replyReason: nullableString(500),
  confidence,
  deadlines: z.array(deadlineSchema).max(10),
  actionItems: z.array(actionItemSchema).max(15),
  meetings: z.array(meetingSchema).max(10),
  evidence: z.array(analysisEvidenceSchema).max(20),
  safetyFlags: z.array(analysisSafetyFlagSchema).max(10),
});

export type EmailAnalysisOutput = z.infer<typeof emailAnalysisSchema>;
