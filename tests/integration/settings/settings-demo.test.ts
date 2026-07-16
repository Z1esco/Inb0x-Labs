import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteAccount,
  getAccount,
  getSettings,
  updateSettings,
} from "@/server/settings/settings-service";
import { resetDemo } from "@/server/services/demo-store";

const demoUser = {
  id: "demo-user",
  email: "judge@inb0x.demo",
  demo: true,
};

beforeEach(resetDemo);

describe("deterministic settings demo mode", () => {
  it("updates preferences without calling external providers", async () => {
    const updated = await updateSettings(demoUser, {
      displayName: "Demo Reviewer",
      timezone: "Asia/Kuala_Lumpur",
      appearance: "dark",
      compactMode: true,
      showAnalytics: false,
      defaultReplyTone: "warm",
    });
    expect(updated.profile.displayName).toBe("Demo Reviewer");
    expect(updated.profile.timezone).toBe("Asia/Kuala_Lumpur");
    expect(updated.appearance).toBe("dark");
    expect(updated.dashboard.compactMode).toBe(true);
    expect(updated.dashboard.showAnalytics).toBe(false);
    expect(updated.ai.defaultReplyTone).toBe("warm");
    expect(updated.gmail.readOnly).toBe(true);
  });

  it("exports fictional data without credentials or provider tokens", async () => {
    const account = await getAccount(demoUser);
    const serialized = JSON.stringify(account);
    expect(account.demoMode).toBe(true);
    expect(account.exportData.threads).toHaveLength(12);
    expect(serialized).not.toMatch(/encrypted_(?:access|refresh)_token/i);
    expect(serialized).not.toMatch(/service_role|openai_api_key/i);
  });

  it("resets preferences when the demo account is cleared", async () => {
    await updateSettings(demoUser, { appearance: "dark", compactMode: true });
    await deleteAccount(demoUser);
    const reset = await getSettings(demoUser);
    expect(reset.appearance).toBe("system");
    expect(reset.dashboard.compactMode).toBe(false);
  });
});
