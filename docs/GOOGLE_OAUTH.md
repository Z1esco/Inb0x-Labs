# Google OAuth and Gmail

Create a Google Cloud project, enable Gmail API, configure the OAuth consent screen, add test users,
and create Web application credentials. Configure:

- Local Gmail callback: `http://localhost:3000/api/gmail/callback`
- Production Gmail callback: `https://YOUR_DOMAIN/api/gmail/callback`
- Supabase application-auth callback: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and the exact `GOOGLE_REDIRECT_URI`. In testing mode,
Google refresh tokens can expire and access is limited to test users. A broader public launch may
require Google verification because Gmail data is sensitive.

The application requests only `openid`, `email`, `profile`, and
`https://www.googleapis.com/auth/gmail.readonly`. Never add Gmail modify, compose, send, or full-mail scopes.
