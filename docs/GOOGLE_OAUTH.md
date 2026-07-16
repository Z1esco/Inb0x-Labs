# Google OAuth and Gmail connection

Gmail authorization is separate from Supabase application sign-in. A user must have a verified
Inb0x session before any Gmail connection route runs. The server requests offline access and only
the identity scopes plus `gmail.readonly`; it never requests or implements Gmail write access.

## Google Cloud setup

1. Create or select a Google Cloud project.
2. Enable **Gmail API** under APIs & Services.
3. Configure the OAuth consent screen with the application name, support email, developer contact,
   privacy policy, and authorized domains.
4. Add these scopes exactly:
   - `openid`
   - `email`
   - `profile`
   - `https://www.googleapis.com/auth/gmail.readonly`
5. Add team and judge accounts as test users while the app is in testing mode.
6. Create an OAuth client with application type **Web application**.
7. Register the exact callback URIs below and copy the client ID and secret into server-side
   environment variables.

Never add `gmail.modify`, `gmail.compose`, `gmail.send`, or `mail.google.com`.

## Redirect URIs

- Local: `http://localhost:3000/api/gmail/callback`
- Production: `https://YOUR_DOMAIN/api/gmail/callback`
- Supabase application sign-in: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

The Gmail URI belongs in Google Cloud Web OAuth credentials. It must match scheme, host, port, path,
and trailing-slash behavior exactly. `redirect_uri_mismatch` usually means one of those values differs
from `GOOGLE_REDIRECT_URI`, or the credential belongs to a different Google Cloud project.

## Authorization and refresh behavior

`GET /api/gmail/connect` creates a random state value, stores only its keyed hash with the authenticated
user and a ten-minute expiry, and places the raw value in an HTTP-only, SameSite=Lax callback cookie.
The Google URL uses `access_type=offline` and `include_granted_scopes=true`. Consent is forced only when
no usable stored refresh token exists. Repeated authorization preserves the existing encrypted refresh
token when Google returns no new one.

The callback compares the cookie and returned state, atomically consumes the database state, verifies
expiry and ownership, exchanges the code, validates the exact granted scopes, verifies the Google ID
token, encrypts provider tokens, and upserts one connection per Inb0x user. State is single-use and the
cookie is cleared on success or failure.

Access tokens are refreshed server-side with a safety buffer. A refreshed access token and expiry are
persisted without replacing the refresh token. An invalid or revoked grant marks the connection as
requiring reauthorization and returns `GMAIL_AUTH_EXPIRED` without exposing provider details.

## Consent and testing-mode problems

- `access_denied` means the user denied consent, is not an allowed test user, or an organization policy
  blocked the requested scope.
- Testing-mode refresh tokens can expire after a short period and the app is limited to configured test
  users.
- `gmail.readonly` is a restricted scope. Public release can require Google verification and additional
  data-handling evidence.
- If offline access was granted previously without a refresh token, disconnect the app from the Google
  Account permissions page and reconnect so consent can issue a fresh token.

## Reauthorization and disconnect

When status returns `requiresReauthorization: true`, start `/api/gmail/connect` again. Disconnect attempts
Google token revocation and always deletes local encrypted tokens even when Google is unavailable.
Disconnect is idempotent and does not delete email-derived data in this task.

## Security design

- Supabase `getUser()` supplies the authenticated user; no client user ID is accepted.
- OAuth state is random, hashed with `OAUTH_STATE_SECRET`, user-bound, expiring, atomic, and single-use.
- Access and refresh tokens use versioned AES-256-GCM payloads with independent random IVs.
- Token and state tables are revoked from authenticated and anonymous Data API roles; server routes use
  the server-only service credential.
- Callback destinations are fixed application paths, never a client-provided URL.
- Errors contain stable codes and request IDs but never codes, state values, tokens, or Google bodies.
