import { z } from "zod";

const optionalTrimmedString = (maximum: number) =>
  z
    .string()
    .trim()
    .max(maximum)
    .optional()
    .transform((value) => value || undefined);

export const gmailSyncInputSchema = z.strictObject({
  limit: z.number().int().min(1).max(50).default(25),
  query: optionalTrimmedString(500),
  pageToken: optionalTrimmedString(2_000),
});

export const gmailThreadListQuerySchema = z.strictObject({
  limit: z.coerce.number().int().min(1).max(50).default(25),
  pageToken: optionalTrimmedString(2_000),
  q: optionalTrimmedString(500),
  category: optionalTrimmedString(50),
  priority: optionalTrimmedString(50),
  needsReply: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),
});

export const analyzeThreadInputSchema = z.strictObject({
  threadId: z.string().trim().min(1).max(200),
  force: z.boolean().default(false),
});
export const analyzeInboxInputSchema = z.strictObject({
  threadIds: z
    .array(z.string().trim().min(1).max(200))
    .min(1)
    .max(50)
    .transform((values) => [...new Set(values)]),
  force: z.boolean().default(false),
});
export const deleteDataInputSchema = z.strictObject({
  confirmation: z.literal("DELETE MY DATA"),
});
