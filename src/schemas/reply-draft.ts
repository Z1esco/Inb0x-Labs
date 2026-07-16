import { z } from "zod";

export const replyDraftInputSchema = z.strictObject({
  threadId: z.string().min(1).max(200),
  tone: z.enum(["direct", "balanced", "warm", "professional"]),
  length: z.enum(["short", "medium", "detailed"]),
  instructions: z.string().trim().max(1000).optional(),
});
export const replyDraftOutputSchema = z.strictObject({
  subject: z.string().min(1).max(300),
  body: z.string().min(1).max(8000),
  confidence: z.number().min(0).max(1),
  uncertainPoints: z.array(z.string().min(1).max(300)).max(10),
  warnings: z.array(z.string().min(1).max(300)).max(10),
});
