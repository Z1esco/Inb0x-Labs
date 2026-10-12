import { describe, expect, it } from "vitest";
import { deleteAccountSchema, updateSettingsSchema } from "@/schemas/settings";

describe("settings validation", () => {
  it("accepts a complete, trimmed preference update", () => {
    expect(
      updateSettingsSchema.parse({
        displayName: "  Ada Judge  ",
        timezone: "Asia/Kuala_Lumpur",
        locale: "en-MY",
        appearance: "dark",
        defaultLandingPage: "inbox",
        compactMode: true,
        showAnalytics: false,
        showInboxHealth: true,
        showRecentActivity: false,
        defaultReplyTone: "professional",
        defaultReplyLength: "short",
      }),
    ).toMatchObject({ displayName: "Ada Judge", appearance: "dark" });
  });

  it("rejects empty, unknown, and invalid preference updates", () => {
    expect(() => updateSettingsSchema.parse({})).toThrow();
    expect(() =>
      updateSettingsSchema.parse({ userId: "other-user" }),
    ).toThrow();
    expect(() =>
      updateSettingsSchema.parse({ timezone: "Not/A_Zone" }),
    ).toThrow();
    expect(() => updateSettingsSchema.parse({ locale: "english" })).toThrow();
  });

  it("requires the exact destructive account confirmation", () => {
    expect(
      deleteAccountSchema.parse({ confirmation: "DELETE MY ACCOUNT" }),
    ).toEqual({ confirmation: "DELETE MY ACCOUNT" });
    expect(() =>
      deleteAccountSchema.parse({ confirmation: "delete my account" }),
    ).toThrow();
  });
});
