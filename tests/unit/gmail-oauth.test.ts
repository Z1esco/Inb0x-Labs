import { describe, expect, it, vi } from "vitest";
import {
  decryptSecret,
  encryptSecret,
  SecretEncryptionError,
  TokenDecryptionError,
} from "@/lib/encryption";
import { AppError } from "@/lib/errors";
import { parseEnvironment } from "@/lib/env";
import {
  preserveRefreshToken,
  requiresTokenRefresh,
  revokeThenDelete,
  serializeConnectionStatus,
} from "@/server/gmail/connection-service";
import {
  buildGoogleAuthorizationUrl,
  FORBIDDEN_GMAIL_SCOPES,
  GMAIL_SCOPES,
  verifyGrantedScopes,
} from "@/server/gmail/oauth";
import {
  createOAuthStateValue,
  hashOAuthState,
  stateValuesMatch,
  validateOAuthStateRecord,
} from "@/server/security/oauth-state";

describe("Gmail scope policy", () => {
  it("contains only the required identity and read-only scopes", () => {
    expect(GMAIL_SCOPES).toEqual([
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/gmail.readonly",
    ]);
    expect(
      GMAIL_SCOPES.some((scope) =>
        FORBIDDEN_GMAIL_SCOPES.includes(scope as never),
      ),
    ).toBe(false);
  });

  it.each(FORBIDDEN_GMAIL_SCOPES)("rejects forbidden scope %s", (scope) => {
    expect(() => verifyGrantedScopes([...GMAIL_SCOPES, scope])).toThrowError(
      AppError,
    );
  });

  it("rejects a grant missing the read-only scope", () => {
    expect(() => verifyGrantedScopes(["openid", "email", "profile"])).toThrow(
      /read-only Gmail permissions/,
    );
  });

  it("builds an offline incremental authorization URL without forced repeat consent", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "client-id.apps.googleusercontent.com");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "client-secret");
    vi.stubEnv(
      "GOOGLE_REDIRECT_URI",
      "http://localhost:3000/api/gmail/callback",
    );
    const url = new URL(buildGoogleAuthorizationUrl("secure-state", false));
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(url.searchParams.get("include_granted_scopes")).toBe("true");
    expect(url.searchParams.get("prompt")).toBeNull();
    expect(url.searchParams.get("state")).toBe("secure-state");
    expect(url.searchParams.get("scope")?.split(" ").sort()).toEqual(
      [...GMAIL_SCOPES].sort(),
    );
    vi.unstubAllEnvs();
  });

  it("forces consent only when a refresh token must be obtained", () => {
    vi.stubEnv("GOOGLE_CLIENT_ID", "client-id.apps.googleusercontent.com");
    vi.stubEnv("GOOGLE_CLIENT_SECRET", "client-secret");
    vi.stubEnv(
      "GOOGLE_REDIRECT_URI",
      "http://localhost:3000/api/gmail/callback",
    );
    const url = new URL(buildGoogleAuthorizationUrl("secure-state", true));
    expect(url.searchParams.get("prompt")).toBe("consent");
    vi.unstubAllEnvs();
  });
});

describe("Gmail environment validation", () => {
  it("allows demo mode without Google credentials", () => {
    expect(parseEnvironment({ DEMO_MODE: "true" }).DEMO_MODE).toBe(true);
  });

  it("rejects weak OAuth state secrets", () => {
    expect(() =>
      parseEnvironment({ DEMO_MODE: "true", OAUTH_STATE_SECRET: "too-short" }),
    ).toThrow(/OAUTH_STATE_SECRET must be at least 32 characters/);
  });

  it("requires the token key to decode to exactly 32 bytes", () => {
    expect(() =>
      parseEnvironment({
        DEMO_MODE: "true",
        TOKEN_ENCRYPTION_KEY: Buffer.alloc(31).toString("base64"),
      }),
    ).toThrow(/TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes/);

    expect(
      parseEnvironment({
        DEMO_MODE: "true",
        TOKEN_ENCRYPTION_KEY: Buffer.alloc(32).toString("base64"),
      }).TOKEN_ENCRYPTION_KEY,
    ).toBeDefined();
  });
});

describe("single-use OAuth state", () => {
  const secret = "s".repeat(48);
  const validRecord = {
    id: "state-1",
    user_id: "user-1",
    expires_at: "2026-07-16T10:10:00.000Z",
    consumed_at: null,
  };

  it("generates unpredictable state and stores only a keyed hash", () => {
    const first = createOAuthStateValue();
    const second = createOAuthStateValue();
    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(40);
    expect(hashOAuthState(first, secret)).not.toContain(first);
  });

  it("compares callback and cookie state safely", () => {
    expect(stateValuesMatch("same", "same")).toBe(true);
    expect(stateValuesMatch("different", "same")).toBe(false);
  });

  it("accepts a valid state for the correct user", () => {
    expect(
      validateOAuthStateRecord(
        validRecord,
        "user-1",
        Date.parse("2026-07-16T10:00:00.000Z"),
      ),
    ).toBe(validRecord);
  });

  it("rejects missing, cross-user, expired, and reused state", () => {
    expect(() => validateOAuthStateRecord(null, "user-1")).toThrowError(
      AppError,
    );
    expect(() =>
      validateOAuthStateRecord(
        validRecord,
        "user-2",
        Date.parse("2026-07-16T10:00:00.000Z"),
      ),
    ).toThrow(/invalid/i);
    expect(() =>
      validateOAuthStateRecord(
        validRecord,
        "user-1",
        Date.parse("2026-07-16T10:11:00.000Z"),
      ),
    ).toThrow(/expired/i);
    expect(() =>
      validateOAuthStateRecord(
        { ...validRecord, consumed_at: "2026-07-16T10:01:00.000Z" },
        "user-1",
      ),
    ).toThrow(/invalid/i);
  });
});

describe("AES-256-GCM secret encryption", () => {
  const key = Buffer.alloc(32, 9).toString("base64");

  it("round trips and uses a unique IV", () => {
    const first = encryptSecret("refresh-token", key);
    const second = encryptSecret("refresh-token", key);
    expect(first).not.toBe(second);
    expect(decryptSecret(first, key)).toBe("refresh-token");
    expect(decryptSecret(second, key)).toBe("refresh-token");
  });

  it("rejects invalid key length and empty input", () => {
    expect(() =>
      encryptSecret("token", Buffer.alloc(31).toString("base64")),
    ).toThrow(SecretEncryptionError);
    expect(() => encryptSecret("", key)).toThrow(SecretEncryptionError);
    expect(() => decryptSecret("", key)).toThrow(TokenDecryptionError);
  });

  it("rejects corrupted ciphertext, auth tag, and unsupported versions", () => {
    const encrypted = JSON.parse(encryptSecret("token", key)) as Record<
      string,
      unknown
    >;
    expect(() =>
      decryptSecret(JSON.stringify({ ...encrypted, ciphertext: "AAAA" }), key),
    ).toThrow(TokenDecryptionError);
    expect(() =>
      decryptSecret(
        JSON.stringify({
          ...encrypted,
          tag: Buffer.alloc(16, 1).toString("base64"),
        }),
        key,
      ),
    ).toThrow(TokenDecryptionError);
    expect(() =>
      decryptSecret(JSON.stringify({ ...encrypted, v: 2 }), key),
    ).toThrow(TokenDecryptionError);
  });
});

describe("connection lifecycle helpers", () => {
  const key = Buffer.alloc(32, 4).toString("base64");

  it("refreshes near expiry but not a healthy token", () => {
    const now = Date.parse("2026-07-16T10:00:00.000Z");
    expect(requiresTokenRefresh("2026-07-16T10:00:30.000Z", now)).toBe(true);
    expect(requiresTokenRefresh("2026-07-16T11:00:00.000Z", now)).toBe(false);
  });

  it("preserves an existing refresh token when Google omits a repeated grant", () => {
    const existing = encryptSecret("existing-refresh", key);
    expect(preserveRefreshToken(undefined, existing, key)).toBe(existing);
    expect(
      decryptSecret(preserveRefreshToken("new-refresh", existing, key), key),
    ).toBe("new-refresh");
    expect(() => preserveRefreshToken(undefined, undefined, key)).toThrow(
      /offline access/i,
    );
  });

  it("serializes status without token or internal identifiers", () => {
    const status = serializeConnectionStatus({
      gmail_address: "user@example.com",
      granted_scopes: [GMAIL_SCOPES[3]],
      connected_at: "2026-07-16T09:00:00.000Z",
      last_synced_at: null,
      revoked_at: null,
    });
    expect(status).toEqual({
      connected: true,
      gmailAddress: "user@example.com",
      grantedScopes: [GMAIL_SCOPES[3]],
      connectedAt: "2026-07-16T09:00:00.000Z",
      lastSyncedAt: null,
      requiresReauthorization: false,
      readOnly: true,
    });
    expect(JSON.stringify(status)).not.toMatch(
      /token|encrypted|client_secret/i,
    );
  });

  it("deletes locally even when remote revocation fails", async () => {
    const deleteLocal = vi.fn(async () => undefined);
    await revokeThenDelete(async () => {
      throw new Error("provider failure");
    }, deleteLocal);
    expect(deleteLocal).toHaveBeenCalledOnce();
  });
});
