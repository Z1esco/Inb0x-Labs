import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  getAccount: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock("@/server/auth/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));
vi.mock("@/server/settings/settings-service", () => ({
  getSettings: mocks.getSettings,
  updateSettings: mocks.updateSettings,
  getAccount: mocks.getAccount,
  deleteAccount: mocks.deleteAccount,
}));

import {
  GET as getSettingsRoute,
  PATCH as patchSettingsRoute,
} from "@/app/api/settings/route";
import {
  DELETE as deleteAccountRoute,
  GET as getAccountRoute,
} from "@/app/api/account/route";
import { clearRateLimits } from "@/server/rate-limit/limiter";

const user = { id: "user-1", email: "user@example.test", demo: false };

beforeEach(() => {
  vi.clearAllMocks();
  clearRateLimits();
  mocks.requireCurrentUser.mockResolvedValue(user);
  mocks.getSettings.mockResolvedValue({ profile: { displayName: "User" } });
  mocks.updateSettings.mockResolvedValue({ appearance: "dark" });
  mocks.getAccount.mockResolvedValue({ id: user.id, exportData: {} });
  mocks.deleteAccount.mockResolvedValue({ deleted: true });
});

describe("settings and account routes", () => {
  it("requires authentication for every route", async () => {
    mocks.requireCurrentUser.mockRejectedValue(
      new AppError("UNAUTHENTICATED", "Please sign in to continue.", 401),
    );
    const responses = await Promise.all([
      getSettingsRoute(),
      patchSettingsRoute(
        new Request("http://localhost/api/settings", {
          method: "PATCH",
          body: JSON.stringify({ appearance: "dark" }),
        }),
      ),
      getAccountRoute(),
      deleteAccountRoute(
        new Request("http://localhost/api/account", {
          method: "DELETE",
          body: JSON.stringify({ confirmation: "DELETE MY ACCOUNT" }),
        }),
      ),
    ]);
    expect(responses.every((response) => response.status === 401)).toBe(true);
    expect(mocks.getSettings).not.toHaveBeenCalled();
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });

  it("passes only validated settings and the authenticated user", async () => {
    const response = await patchSettingsRoute(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          appearance: "dark",
          compactMode: true,
          userId: "other-user",
        }),
      }),
    );
    expect(response.status).toBe(400);
    expect(mocks.updateSettings).not.toHaveBeenCalled();

    const valid = await patchSettingsRoute(
      new Request("http://localhost/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ appearance: "dark", compactMode: true }),
      }),
    );
    expect(valid.status).toBe(200);
    expect(mocks.updateSettings).toHaveBeenCalledWith(user, {
      appearance: "dark",
      compactMode: true,
    });
  });

  it("exports the authenticated account without accepting an owner id", async () => {
    const response = await getAccountRoute();
    expect(response.status).toBe(200);
    expect(mocks.getAccount).toHaveBeenCalledWith(user);
    expect((await response.json()).meta.format).toBe("json");
  });

  it("requires exact confirmation before account deletion", async () => {
    const rejected = await deleteAccountRoute(
      new Request("http://localhost/api/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "DELETE" }),
      }),
    );
    expect(rejected.status).toBe(400);
    expect(mocks.deleteAccount).not.toHaveBeenCalled();

    const accepted = await deleteAccountRoute(
      new Request("http://localhost/api/account", {
        method: "DELETE",
        body: JSON.stringify({ confirmation: "DELETE MY ACCOUNT" }),
      }),
    );
    expect(accepted.status).toBe(200);
    expect(mocks.deleteAccount).toHaveBeenCalledWith(user);
  });
});
