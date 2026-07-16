import type { Credentials } from "google-auth-library";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptSecret, encryptSecret } from "@/lib/encryption";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";
import {
  createGoogleOAuthClient,
  verifyGrantedScopes,
} from "@/server/gmail/oauth";
import type { GmailConnectionStatus } from "@/types/contracts";

const REFRESH_SAFETY_BUFFER_MS = 60_000;
type GoogleOAuthClient = ReturnType<typeof createGoogleOAuthClient>;
const refreshLocks = new Map<string, Promise<GoogleOAuthClient>>();

interface GmailConnectionRow {
  id: string;
  user_id: string;
  google_subject: string;
  gmail_address: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string;
  token_expiry: string | null;
  granted_scopes: string[];
  connected_at: string;
  last_synced_at: string | null;
  revoked_at: string | null;
}

function encryptionKey(): string {
  const key = getEnvironment().TOKEN_ENCRYPTION_KEY;
  if (!key)
    throw new AppError(
      "GOOGLE_CONFIGURATION_ERROR",
      "Google token encryption is not configured.",
      503,
    );
  return key;
}

async function findConnection(
  userId: string,
): Promise<GmailConnectionRow | null> {
  const { data, error } = await createSupabaseAdminClient()
    .from("gmail_connections")
    .select(
      "id,user_id,google_subject,gmail_address,encrypted_access_token,encrypted_refresh_token,token_expiry,granted_scopes,connected_at,last_synced_at,revoked_at",
    )
    .eq("user_id", userId)
    .maybeSingle();
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Gmail connection could not be loaded.",
      500,
    );
  return data as GmailConnectionRow | null;
}

export function requiresTokenRefresh(
  tokenExpiry: string | null,
  now = Date.now(),
): boolean {
  return (
    !tokenExpiry ||
    !Number.isFinite(Date.parse(tokenExpiry)) ||
    Date.parse(tokenExpiry) <= now + REFRESH_SAFETY_BUFFER_MS
  );
}

export function preserveRefreshToken(
  newRefreshToken: string | null | undefined,
  existingEncryptedRefreshToken: string | null | undefined,
  key: string,
): string {
  if (newRefreshToken) return encryptSecret(newRefreshToken, key);
  if (existingEncryptedRefreshToken) return existingEncryptedRefreshToken;
  throw new AppError(
    "GMAIL_AUTH_EXPIRED",
    "Google did not provide offline access. Reconnect Gmail and approve consent.",
    400,
  );
}

export function serializeConnectionStatus(
  connection: Pick<
    GmailConnectionRow,
    | "gmail_address"
    | "granted_scopes"
    | "connected_at"
    | "last_synced_at"
    | "revoked_at"
  > | null,
): GmailConnectionStatus {
  return {
    connected: Boolean(connection && !connection.revoked_at),
    gmailAddress: connection?.gmail_address ?? null,
    grantedScopes: connection?.granted_scopes ?? [],
    connectedAt: connection?.connected_at ?? null,
    lastSyncedAt: connection?.last_synced_at ?? null,
    requiresReauthorization: Boolean(connection?.revoked_at),
    readOnly: true,
  };
}

export async function shouldForceGoogleConsent(
  userId: string,
): Promise<boolean> {
  const connection = await findConnection(userId);
  return Boolean(!connection?.encrypted_refresh_token || connection.revoked_at);
}

export async function exchangeAndStoreGoogleCode(
  userId: string,
  code: string,
): Promise<void> {
  if (!code)
    throw new AppError(
      "INVALID_REQUEST",
      "Google did not return an authorization code.",
      400,
    );
  const existing = await findConnection(userId);
  const oauth = createGoogleOAuthClient();
  let tokens: Credentials;
  try {
    ({ tokens } = await oauth.getToken(code));
  } catch {
    throw new AppError(
      "GMAIL_AUTH_EXPIRED",
      "Google authorization could not be completed. Please reconnect Gmail.",
      401,
    );
  }
  if (!tokens.access_token)
    throw new AppError(
      "GMAIL_AUTH_EXPIRED",
      "Google did not provide a usable access token.",
      401,
    );

  const grantedScopes = verifyGrantedScopes(
    (tokens.scope ?? "").split(" ").filter(Boolean),
  );
  oauth.setCredentials(tokens);
  const clientId = getEnvironment().GOOGLE_CLIENT_ID;
  if (!clientId || !tokens.id_token)
    throw new AppError(
      "GMAIL_PERMISSION_DENIED",
      "Google identity could not be verified.",
      403,
    );
  let payload: { sub?: string; email?: string } | undefined;
  try {
    const ticket = await oauth.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch {
    throw new AppError(
      "GMAIL_PERMISSION_DENIED",
      "Google identity could not be verified.",
      403,
    );
  }
  if (!payload?.sub || !payload.email)
    throw new AppError(
      "GMAIL_PERMISSION_DENIED",
      "Google identity could not be verified.",
      403,
    );

  const key = encryptionKey();
  const { error } = await createSupabaseAdminClient()
    .from("gmail_connections")
    .upsert(
      {
        user_id: userId,
        google_subject: payload.sub,
        gmail_address: payload.email,
        encrypted_access_token: encryptSecret(tokens.access_token, key),
        encrypted_refresh_token: preserveRefreshToken(
          tokens.refresh_token,
          existing?.encrypted_refresh_token,
          key,
        ),
        token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        granted_scopes: grantedScopes,
        revoked_at: null,
      },
      { onConflict: "user_id" },
    );
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Gmail connection could not be stored.",
      500,
    );
}

async function refreshGoogleClient(
  userId: string,
  connection: GmailConnectionRow,
): Promise<GoogleOAuthClient> {
  const key = encryptionKey();
  const oauth = createGoogleOAuthClient();
  oauth.setCredentials({
    access_token: decryptSecret(connection.encrypted_access_token, key),
    refresh_token: decryptSecret(connection.encrypted_refresh_token, key),
    expiry_date: connection.token_expiry
      ? Date.parse(connection.token_expiry)
      : null,
  });
  if (!requiresTokenRefresh(connection.token_expiry)) return oauth;

  try {
    const accessToken = await oauth.getAccessToken();
    if (!accessToken.token) throw new Error("Google returned no access token");
    const expiryDate = oauth.credentials.expiry_date;
    const { error } = await createSupabaseAdminClient()
      .from("gmail_connections")
      .update({
        encrypted_access_token: encryptSecret(accessToken.token, key),
        token_expiry: expiryDate ? new Date(expiryDate).toISOString() : null,
        revoked_at: null,
      })
      .eq("id", connection.id)
      .eq("user_id", userId);
    if (error) throw error;
    return oauth;
  } catch {
    await createSupabaseAdminClient()
      .from("gmail_connections")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", connection.id)
      .eq("user_id", userId);
    throw new AppError(
      "GMAIL_AUTH_EXPIRED",
      "Gmail authorization expired. Please reconnect Gmail.",
      401,
    );
  }
}

export async function getAuthenticatedGoogleClient(
  userId: string,
): Promise<GoogleOAuthClient> {
  const existingLock = refreshLocks.get(userId);
  if (existingLock) return existingLock;
  const operation = (async () => {
    const connection = await findConnection(userId);
    if (!connection)
      throw new AppError(
        "GMAIL_NOT_CONNECTED",
        "Connect Gmail before continuing.",
        409,
      );
    if (connection.revoked_at)
      throw new AppError(
        "GMAIL_AUTH_EXPIRED",
        "Gmail authorization expired. Please reconnect Gmail.",
        401,
      );
    return refreshGoogleClient(userId, connection);
  })();
  refreshLocks.set(userId, operation);
  try {
    return await operation;
  } finally {
    refreshLocks.delete(userId);
  }
}

export async function loadGoogleCredentials(
  userId: string,
): Promise<Credentials> {
  return (await getAuthenticatedGoogleClient(userId)).credentials;
}

export async function getGmailConnectionStatus(
  userId: string,
): Promise<GmailConnectionStatus> {
  return serializeConnectionStatus(await findConnection(userId));
}

export async function revokeThenDelete(
  revoke: () => Promise<void>,
  deleteLocal: () => Promise<void>,
): Promise<void> {
  try {
    await revoke();
  } catch {
    // Revocation is best effort. Local token deletion is mandatory.
  }
  await deleteLocal();
}

export async function disconnectGmail(userId: string): Promise<void> {
  const connection = await findConnection(userId);
  if (!connection) return;
  await revokeThenDelete(
    async () => {
      const refreshToken = decryptSecret(
        connection.encrypted_refresh_token,
        encryptionKey(),
      );
      await createGoogleOAuthClient().revokeToken(refreshToken);
    },
    async () => {
      const { error } = await createSupabaseAdminClient()
        .from("gmail_connections")
        .delete()
        .eq("id", connection.id)
        .eq("user_id", userId);
      if (error)
        throw new AppError(
          "INTERNAL_ERROR",
          "Gmail credentials could not be removed.",
          500,
        );
    },
  );
}
