import type { Credentials } from "google-auth-library";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptToken, encryptToken } from "@/lib/encryption";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";
import { createGoogleOAuthClient } from "@/server/gmail/oauth";

export async function exchangeAndStoreGoogleCode(
  userId: string,
  code: string,
): Promise<void> {
  const oauth = createGoogleOAuthClient();
  const { tokens } = await oauth.getToken(code);
  if (!tokens.access_token || !tokens.refresh_token)
    throw new AppError(
      "GMAIL_AUTH_EXPIRED",
      "Google did not provide offline access. Reconnect Gmail and approve consent.",
      400,
    );
  oauth.setCredentials(tokens);
  const clientId = getEnvironment().GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("Google OAuth configuration is missing");
  const ticket = await oauth.verifyIdToken({
    idToken: tokens.id_token ?? "",
    audience: clientId,
  });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email)
    throw new AppError(
      "GMAIL_PERMISSION_DENIED",
      "Google identity could not be verified.",
      403,
    );
  const env = getEnvironment();
  const key = env.TOKEN_ENCRYPTION_KEY!;
  const scopes = (tokens.scope ?? "").split(" ").filter(Boolean);
  const { error } = await createSupabaseAdminClient()
    .from("gmail_connections")
    .upsert(
      {
        user_id: userId,
        google_subject: payload.sub,
        gmail_address: payload.email,
        encrypted_access_token: encryptToken(tokens.access_token, key),
        encrypted_refresh_token: encryptToken(tokens.refresh_token, key),
        token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date).toISOString()
          : null,
        granted_scopes: scopes,
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
export async function loadGoogleCredentials(
  userId: string,
): Promise<Credentials> {
  const { data, error } = await createSupabaseAdminClient()
    .from("gmail_connections")
    .select("encrypted_access_token, encrypted_refresh_token, token_expiry")
    .eq("user_id", userId)
    .is("revoked_at", null)
    .maybeSingle();
  if (error || !data)
    throw new AppError(
      "GMAIL_NOT_CONNECTED",
      "Connect Gmail before continuing.",
      409,
    );
  const key = getEnvironment().TOKEN_ENCRYPTION_KEY!;
  return {
    access_token: decryptToken(data.encrypted_access_token, key),
    refresh_token: decryptToken(data.encrypted_refresh_token, key),
    expiry_date: data.token_expiry ? Date.parse(data.token_expiry) : null,
  };
}
export async function disconnectGmail(userId: string): Promise<void> {
  const admin = createSupabaseAdminClient();
  let credentials: Credentials | null = null;
  try {
    credentials = await loadGoogleCredentials(userId);
  } catch {
    /* Local cleanup still runs. */
  }
  if (credentials?.refresh_token) {
    try {
      await createGoogleOAuthClient().revokeToken(credentials.refresh_token);
    } catch {
      /* Best effort remote revocation. */
    }
  }
  const { error } = await admin
    .from("gmail_connections")
    .delete()
    .eq("user_id", userId);
  if (error)
    throw new AppError(
      "INTERNAL_ERROR",
      "Gmail credentials could not be removed.",
      500,
    );
}
