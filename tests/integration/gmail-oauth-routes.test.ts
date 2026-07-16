import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";

const mocks = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
  issueOAuthState: vi.fn(),
  consumeOAuthState: vi.fn(),
  shouldForceGoogleConsent: vi.fn(),
  buildGoogleAuthorizationUrl: vi.fn(),
  exchangeAndStoreGoogleCode: vi.fn(),
  getGmailConnectionStatus: vi.fn(),
  disconnectGmail: vi.fn(),
  cookieValue: "valid-state",
  cookieSet: vi.fn(),
  cookieDelete: vi.fn(),
}));

vi.mock("@/server/auth/current-user", () => ({
  requireCurrentUser: mocks.requireCurrentUser,
}));
vi.mock("@/server/security/oauth-state", () => ({
  issueOAuthState: mocks.issueOAuthState,
  consumeOAuthState: mocks.consumeOAuthState,
  stateValuesMatch: (received: string, expected: string) =>
    received === expected,
}));
vi.mock("@/server/gmail/oauth", () => ({
  buildGoogleAuthorizationUrl: mocks.buildGoogleAuthorizationUrl,
}));
vi.mock("@/server/gmail/connection-service", () => ({
  shouldForceGoogleConsent: mocks.shouldForceGoogleConsent,
  exchangeAndStoreGoogleCode: mocks.exchangeAndStoreGoogleCode,
  getGmailConnectionStatus: mocks.getGmailConnectionStatus,
  disconnectGmail: mocks.disconnectGmail,
}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: () => (mocks.cookieValue ? { value: mocks.cookieValue } : undefined),
    set: mocks.cookieSet,
    delete: mocks.cookieDelete,
  })),
}));

import { GET as connect } from "@/app/api/gmail/connect/route";
import { GET as callback } from "@/app/api/gmail/callback/route";
import { GET as status } from "@/app/api/gmail/status/route";
import { POST as disconnect } from "@/app/api/gmail/disconnect/route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.cookieValue = "valid-state";
  mocks.requireCurrentUser.mockResolvedValue({
    id: "user-1",
    email: "user@example.com",
    demo: false,
  });
  mocks.issueOAuthState.mockResolvedValue("valid-state");
  mocks.shouldForceGoogleConsent.mockResolvedValue(false);
  mocks.buildGoogleAuthorizationUrl.mockReturnValue(
    "https://accounts.google.com/o/oauth2/v2/auth?state=valid-state",
  );
  mocks.consumeOAuthState.mockResolvedValue(undefined);
  mocks.exchangeAndStoreGoogleCode.mockResolvedValue(undefined);
  mocks.disconnectGmail.mockResolvedValue(undefined);
});

describe("authenticated Gmail connection routes", () => {
  it.each([
    ["connect", connect],
    ["status", status],
    ["disconnect", disconnect],
  ] as const)("rejects unauthenticated %s", async (_name, handler) => {
    mocks.requireCurrentUser.mockRejectedValue(
      new AppError("UNAUTHENTICATED", "Please sign in to continue.", 401),
    );
    const response = await handler();
    const payload = await response.json();
    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("UNAUTHENTICATED");
    expect(payload.error.requestId).toBeTruthy();
  });

  it("starts authorization with a secure callback cookie", async () => {
    const response = await connect();
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("accounts.google.com");
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "inb0x_oauth_state",
      "valid-state",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        maxAge: 600,
        path: "/api/gmail/callback",
      }),
    );
  });

  it("returns deterministic demo behavior without Google", async () => {
    mocks.requireCurrentUser.mockResolvedValue({
      id: "demo",
      email: "judge@inb0x.demo",
      demo: true,
    });
    const connectResponse = await connect();
    expect((await connectResponse.json()).error.code).toBe("DEMO_MODE_ONLY");
    const statusResponse = await status();
    const payload = await statusResponse.json();
    expect(payload.data).toMatchObject({
      connected: true,
      gmailAddress: "judge@inb0x.demo",
      readOnly: true,
    });
  });
});

describe("OAuth callback", () => {
  const request = (query: string) =>
    new NextRequest(`http://localhost:3000/api/gmail/callback?${query}`);

  it("consumes state, stores tokens, and redirects to a fixed success route", async () => {
    const response = await callback(
      request("state=valid-state&code=authorization-code"),
    );
    expect(mocks.consumeOAuthState).toHaveBeenCalledWith(
      "valid-state",
      "user-1",
    );
    expect(mocks.exchangeAndStoreGoogleCode).toHaveBeenCalledWith(
      "user-1",
      "authorization-code",
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/dashboard?gmail=connected",
    );
    expect(mocks.cookieDelete).toHaveBeenCalledWith("inb0x_oauth_state");
  });

  it("consumes denied consent state and redirects safely", async () => {
    const response = await callback(
      request("state=valid-state&error=access_denied"),
    );
    expect(mocks.consumeOAuthState).toHaveBeenCalledOnce();
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/settings?gmail=denied",
    );
  });

  it("redirects invalid, expired, and reused state to the fixed error route", async () => {
    mocks.cookieValue = "different";
    expect(
      (await callback(request("state=valid-state&code=x"))).headers.get(
        "location",
      ),
    ).toBe("http://localhost:3000/settings?gmail=error");
    mocks.cookieValue = "valid-state";
    mocks.consumeOAuthState.mockRejectedValueOnce(
      new AppError("OAUTH_STATE_EXPIRED", "expired", 403),
    );
    expect(
      (await callback(request("state=valid-state&code=x"))).headers.get(
        "location",
      ),
    ).toBe("http://localhost:3000/settings?gmail=error");
    mocks.consumeOAuthState.mockRejectedValueOnce(
      new AppError("OAUTH_STATE_INVALID", "used", 403),
    );
    expect(
      (await callback(request("state=valid-state&code=x"))).headers.get(
        "location",
      ),
    ).toBe("http://localhost:3000/settings?gmail=error");
  });

  it("returns a safe contract error when the callback code is missing", async () => {
    const response = await callback(request("state=valid-state"));
    const payload = await response.json();
    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_REQUEST");
    expect(JSON.stringify(payload)).not.toContain("valid-state");
  });
});

describe("disconnect", () => {
  it("is idempotent and returns safe success", async () => {
    const response = await disconnect();
    expect(await response.json()).toMatchObject({
      success: true,
      data: { disconnected: true },
    });
    expect(mocks.disconnectGmail).toHaveBeenCalledWith("user-1");
  });
});
