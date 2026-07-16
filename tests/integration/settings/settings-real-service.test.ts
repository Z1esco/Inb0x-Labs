import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  loadSettingsRows: vi.fn(),
  updateSettingsRows: vi.fn(),
  exportAccountRows: vi.fn(),
  deleteAuthAccount: vi.fn(),
  getAnalysisUsage: vi.fn(),
  getReplyUsage: vi.fn(),
  getGmailConnectionStatus: vi.fn(),
}));

vi.mock("@/server/settings/settings-repository", () => ({
  loadSettingsRows: mocks.loadSettingsRows,
  updateSettingsRows: mocks.updateSettingsRows,
  exportAccountRows: mocks.exportAccountRows,
  deleteAuthAccount: mocks.deleteAuthAccount,
}));
vi.mock("@/server/ai/analysis-service", () => ({
  getAnalysisUsage: mocks.getAnalysisUsage,
}));
vi.mock("@/server/replies/reply-service", () => ({
  getReplyUsage: mocks.getReplyUsage,
}));
vi.mock("@/server/gmail/connection-service", () => ({
  getGmailConnectionStatus: mocks.getGmailConnectionStatus,
}));

import {
  deleteAccount,
  getAccount,
  getSettings,
  updateSettings,
} from "@/server/settings/settings-service";

const user = { id: "user-1", email: "user@example.test", demo: false };
const rows = {
  profile: { display_name: "User", avatar_url: null },
  settings: {
    timezone: "UTC",
    locale: "en",
    appearance: "system",
    default_landing_page: "dashboard",
    compact_mode: false,
    show_analytics: true,
    show_inbox_health: true,
    show_recent_activity: true,
    preferred_tone: "balanced",
    preferred_reply_length: "medium",
    daily_analysis_limit: 20,
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.loadSettingsRows.mockResolvedValue(rows);
  mocks.getAnalysisUsage.mockResolvedValue({
    used: 1,
    limit: 20,
    remaining: 19,
  });
  mocks.getReplyUsage.mockResolvedValue({ used: 2, limit: 20, remaining: 18 });
  mocks.getGmailConnectionStatus.mockResolvedValue({
    connected: false,
    gmailAddress: null,
    grantedScopes: [],
    connectedAt: null,
    lastSyncedAt: null,
    requiresReauthorization: false,
    readOnly: true,
  });
  mocks.exportAccountRows.mockResolvedValue({
    profile: { id: user.id, created_at: "2026-07-16T00:00:00.000Z" },
    settings: {},
    gmail: null,
    threads: [],
    analyses: [],
    tasks: [],
    drafts: [],
  });
});

describe("real settings service ownership", () => {
  it("reads preferences, usage, and Gmail status for only the current user", async () => {
    const result = await getSettings(user);
    expect(mocks.loadSettingsRows).toHaveBeenCalledWith("user-1");
    expect(mocks.getAnalysisUsage).toHaveBeenCalledWith("user-1", 20);
    expect(mocks.getReplyUsage).toHaveBeenCalledWith("user-1");
    expect(mocks.getGmailConnectionStatus).toHaveBeenCalledWith("user-1");
    expect(result.gmail).not.toHaveProperty("encryptedAccessToken");
  });

  it("scopes updates and account operations to the authenticated user", async () => {
    await updateSettings(user, { appearance: "dark" });
    expect(mocks.updateSettingsRows).toHaveBeenCalledWith("user-1", {
      appearance: "dark",
    });

    await getAccount(user);
    expect(mocks.exportAccountRows).toHaveBeenCalledWith("user-1");

    await deleteAccount(user);
    expect(mocks.deleteAuthAccount).toHaveBeenCalledWith("user-1");
  });
});
