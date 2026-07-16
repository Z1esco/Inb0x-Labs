import { google } from "googleapis";
import { getEnvironment } from "@/lib/env";
import { AppError } from "@/lib/errors";

export const GMAIL_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
] as const;
export const FORBIDDEN_GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.modify",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.send",
  "https://mail.google.com/",
] as const;

export function verifyGrantedScopes(scopes: readonly string[]): string[] {
  const unique = [...new Set(scopes.filter(Boolean))];
  if (FORBIDDEN_GMAIL_SCOPES.some((scope) => unique.includes(scope)))
    throw new AppError(
      "GMAIL_PERMISSION_DENIED",
      "Google granted permissions that Inb0x does not accept.",
      403,
    );
  if (GMAIL_SCOPES.some((scope) => !unique.includes(scope)))
    throw new AppError(
      "GMAIL_PERMISSION_DENIED",
      "The required read-only Gmail permissions were not granted.",
      403,
    );
  return unique;
}

export function createGoogleOAuthClient() {
  const env = getEnvironment();
  if (
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET ||
    !env.GOOGLE_REDIRECT_URI
  )
    throw new AppError(
      "GOOGLE_CONFIGURATION_ERROR",
      "Google OAuth is not configured.",
      503,
    );
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}
export function buildGoogleAuthorizationUrl(
  state: string,
  forceConsent: boolean,
): string {
  return createGoogleOAuthClient().generateAuthUrl({
    access_type: "offline",
    ...(forceConsent ? { prompt: "consent" as const } : {}),
    include_granted_scopes: true,
    scope: [...GMAIL_SCOPES],
    state,
  });
}
