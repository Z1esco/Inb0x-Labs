import { z } from "zod";
import { isValidTimezone } from "@/schemas/dashboard";

export const updateSettingsSchema = z
  .strictObject({
    displayName: z.string().trim().min(1).max(100).nullable().optional(),
    timezone: z
      .string()
      .trim()
      .min(1)
      .max(100)
      .refine(isValidTimezone)
      .optional(),
    locale: z
      .string()
      .trim()
      .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/)
      .max(10)
      .optional(),
    appearance: z.enum(["light", "dark", "system"]).optional(),
    defaultLandingPage: z.enum(["dashboard", "inbox", "tasks"]).optional(),
    compactMode: z.boolean().optional(),
    showAnalytics: z.boolean().optional(),
    showInboxHealth: z.boolean().optional(),
    showRecentActivity: z.boolean().optional(),
    defaultReplyTone: z
      .enum(["direct", "balanced", "warm", "professional"])
      .optional(),
    defaultReplyLength: z.enum(["short", "medium", "detailed"]).optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    "At least one setting is required",
  );

export const deleteAccountSchema = z.strictObject({
  confirmation: z.literal("DELETE MY ACCOUNT"),
});
