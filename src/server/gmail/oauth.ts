import { google } from "googleapis";
import { getEnvironment } from "@/lib/env";

export const GMAIL_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.readonly",
] as const;
export function createGoogleOAuthClient() {
  const env = getEnvironment();
  if (
    !env.GOOGLE_CLIENT_ID ||
    !env.GOOGLE_CLIENT_SECRET ||
    !env.GOOGLE_REDIRECT_URI
  )
    throw new Error("Google OAuth configuration is missing");
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );
}
export function buildGoogleAuthorizationUrl(state: string): string {
  return createGoogleOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: false,
    scope: [...GMAIL_SCOPES],
    state,
  });
}
