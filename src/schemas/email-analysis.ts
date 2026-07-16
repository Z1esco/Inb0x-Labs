import { z } from "zod";

const evidenceText = z.string().min(1).max(500);
export const deadlineSchema = z.strictObject({
  id: z.string().min(1),
  label: z.string().min(1).max(200),
  dueAt: z.string().datetime().nullable(),
  evidence: evidenceText,
  confidence: z.number().min(0).max(1),
});
export const actionItemSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1).max(300),
  owner: z.string().max(200).nullable(),
  dueAt: z.string().datetime().nullable(),
  evidence: evidenceText,
});
export const meetingSchema = z.strictObject({
  id: z.string().min(1),
  title: z.string().min(1).max(300),
  startsAt: z.string().datetime().nullable(),
  location: z.string().max(300).nullable(),
  evidence: evidenceText,
});
export const emailAnalysisSchema = z.strictObject({
  summary: z.string().min(1).max(800),
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
  priorityReason: z.string().min(1).max(500),
  needsReply: z.boolean(),
  replyReason: z.string().max(500).nullable(),
  confidence: z.number().min(0).max(1),
  deadlines: z.array(deadlineSchema).max(10),
  actionItems: z.array(actionItemSchema).max(20),
  meetings: z.array(meetingSchema).max(10),
  evidence: z.array(evidenceText).max(20),
  safetyFlags: z.array(z.string().min(1).max(200)).max(20),
});
export type EmailAnalysisOutput = z.infer<typeof emailAnalysisSchema>;
