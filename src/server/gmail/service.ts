import { google } from "googleapis";
import type { Credentials } from "google-auth-library";
import { createGoogleOAuthClient } from "@/server/gmail/oauth";
import { normalizeGmailThread } from "@/server/gmail/normalize";

export function createAuthenticatedGmailClient(credentials: Credentials) {
  const auth = createGoogleOAuthClient();
  auth.setCredentials(credentials);
  return google.gmail({ version: "v1", auth });
}
export async function listRecentGmailThreads(
  credentials: Credentials,
  lookbackDays: number,
  maxResults: number,
) {
  const gmail = createAuthenticatedGmailClient(credentials);
  return (
    await gmail.users.threads.list({
      userId: "me",
      maxResults,
      q: `in:inbox newer_than:${lookbackDays}d`,
    })
  ).data;
}
export async function getNormalizedGmailThread(
  credentials: Credentials,
  threadId: string,
  maxCharacters: number,
) {
  const gmail = createAuthenticatedGmailClient(credentials);
  const response = await gmail.users.threads.get({
    userId: "me",
    id: threadId,
    format: "full",
  });
  return normalizeGmailThread(response.data, maxCharacters);
}
