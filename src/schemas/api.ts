import { z } from "zod";

export const analyzeThreadInputSchema = z.strictObject({
  threadId: z.string().min(1),
  force: z.boolean().default(false),
});
export const analyzeInboxInputSchema = z.strictObject({
  threadIds: z.array(z.string().min(1)).min(1).max(20),
  force: z.boolean().default(false),
});
export const settingsInputSchema = z
  .strictObject({
    dailyAnalysisLimit: z.number().int().min(1).max(100).optional(),
    gmailLookbackDays: z.number().int().min(1).max(365).optional(),
    gmailMaxThreads: z.number().int().min(1).max(100).optional(),
    dataRetentionHours: z.number().int().min(1).max(720).optional(),
    preferredTone: z
      .enum(["direct", "balanced", "warm", "professional"])
      .optional(),
    preferredReplyLength: z.enum(["short", "medium", "detailed"]).optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one field is required",
  );
export const deleteDataInputSchema = z.strictObject({
  confirmation: z.literal("DELETE MY DATA"),
});
