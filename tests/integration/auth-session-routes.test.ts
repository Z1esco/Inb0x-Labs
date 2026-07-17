import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  demoMode: true,
  signOut: vi.fn(),
  exchangeCodeForSession: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getEnvironment: () => ({
    DEMO_MODE: mocks.demoMode,
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      signOut: mocks.signOut,
      exchangeCodeForSession: mocks.exchangeCodeForSession,
    },
  }),
}));

import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as callback } from "@/app/auth/callback/route";

describe("auth session routes", () => {
  beforeEach(() => {
    mocks.demoMode = true;
    mocks.signOut.mockReset();
    mocks.exchangeCodeForSession.mockReset();
  });

  it("exchanges a Supabase PKCE code and uses only fixed redirects", async () => {
    mocks.exchangeCodeForSession.mockResolvedValue({ error: null });
    const success = await callback(
      new NextRequest("http://localhost:3000/auth/callback?code=safe-code"),
    );
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("safe-code");
    expect(success.headers.get("location")).toBe(
      "http://localhost:3000/dashboard",
    );

    mocks.exchangeCodeForSession.mockResolvedValueOnce({
      error: new Error("provider detail"),
    });
    const failure = await callback(
      new NextRequest(
        "http://localhost:3000/auth/callback?code=bad&next=https://attacker.test",
      ),
    );
    expect(failure.headers.get("location")).toBe(
      "http://localhost:3000/login?auth=error",
    );

    const missing = await callback(
      new NextRequest("http://localhost:3000/auth/callback"),
    );
    expect(missing.headers.get("location")).toBe(
      "http://localhost:3000/login?auth=error",
    );
  });

  it("exits demo mode without requiring Supabase", async () => {
    const response = await logout();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      data: { signedOut: true },
      meta: { demo: true },
    });
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("clears only the local authenticated session in real mode", async () => {
    mocks.demoMode = false;
    mocks.signOut.mockResolvedValue({ error: null });
    const response = await logout();
    expect(response.status).toBe(200);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });

  it("maps Supabase sign-out failures to a safe error", async () => {
    mocks.demoMode = false;
    mocks.signOut.mockResolvedValue({ error: new Error("provider detail") });
    const response = await logout();
    const body = await response.json();
    expect(response.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toContain("provider detail");
  });
});
