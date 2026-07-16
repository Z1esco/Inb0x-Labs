import { z } from "zod";

export const replyDraftInputSchema = z.strictObject({
  threadId: z.string().trim().min(1).max(200),
  tone: z.enum(["direct", "balanced", "warm", "professional"]),
  length: z.enum(["short", "medium", "detailed"]),
  instructions: z.string().trim().max(1000).optional(),
  force: z.boolean().default(false),
});
const boundedString = (maximum: number) =>
  z.string().trim().min(1).max(maximum);
export const replyEvidenceSchema = z.strictObject({
  claim: boundedString(300),
  sourceMessageId: boundedString(200),
  excerpt: boundedString(300),
});
export const replyDraftOutputSchema = z.strictObject({
  subject: boundedString(200),
  body: boundedString(6000),
  tone: z.enum(["direct", "balanced", "warm", "professional"]),
  length: z.enum(["short", "medium", "detailed"]),
  confidence: z.number().min(0).max(1),
  usedFacts: z.array(boundedString(300)).max(20),
  uncertainPoints: z.array(boundedString(300)).max(15),
  warnings: z.array(boundedString(300)).max(15),
  evidence: z.array(replyEvidenceSchema).max(20),
});

export const replyDraftIdSchema = z.string().trim().min(1).max(200);
export const replyDraftQuerySchema = z.strictObject({
  threadId: z.string().trim().min(1).max(200).optional(),
  tone: z.enum(["direct", "balanced", "warm", "professional"]).optional(),
  length: z.enum(["short", "medium", "detailed"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).max(1000).optional(),
  sort: z
    .enum(["created_desc", "created_asc", "updated_desc"])
    .default("created_desc"),
});
