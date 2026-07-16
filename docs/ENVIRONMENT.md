# Environment variables

`.env.example` is the executable inventory and this document explains where each value belongs.
Use `.env.local` only for local development and Vercel Environment Variables for deployments.
Never commit values, paste privileged values into issues or logs, or prefix a server secret with
`NEXT_PUBLIC_`.

## Inventory

| Variable                        | Exposure                  | Demo                       | Real mode          | Purpose                                                                         |
| ------------------------------- | ------------------------- | -------------------------- | ------------------ | ------------------------------------------------------------------------------- |
| `DEMO_MODE`                     | Server                    | Required (`true`)          | Required (`false`) | Selects deterministic fixtures or external services.                            |
| `NEXT_PUBLIC_APP_URL`           | Browser-safe              | Required for deployed demo | Required           | Canonical origin used for fixed redirects; no trailing path.                    |
| `NEXT_PUBLIC_SUPABASE_URL`      | Browser-safe              | Not required               | Required           | Supabase project URL.                                                           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-safe              | Not required               | Required           | Current publishable key or legacy anon key; RLS still applies.                  |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-only secret        | Not required               | Required           | Privileged server repository access and Auth Admin deletion. Rotate before use. |
| `GOOGLE_CLIENT_ID`              | Server-only configuration | Not required               | Required           | Dedicated Gmail OAuth web client ID.                                            |
| `GOOGLE_CLIENT_SECRET`          | Server-only secret        | Not required               | Required           | Dedicated Gmail OAuth web client secret.                                        |
| `GOOGLE_REDIRECT_URI`           | Server-only configuration | Not required               | Required           | Exact Gmail callback URI.                                                       |
| `OAUTH_STATE_SECRET`            | Server-only secret        | Not required               | Required           | At least 32 random characters for keyed OAuth state hashes.                     |
| `TOKEN_ENCRYPTION_KEY`          | Server-only secret        | Not required               | Required           | Base64 value decoding to exactly 32 random bytes for AES-256-GCM.               |
| `OPENAI_API_KEY`                | Server-only secret        | Not required               | Required           | OpenAI API project key.                                                         |
| `OPENAI_MODEL`                  | Server-only configuration | Not required               | Required           | Responses Structured Outputs-capable model enabled for the project.             |
| `OPENAI_REASONING_EFFORT`       | Server-only tuning        | Optional                   | Optional           | `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, or `max`; default `low`.   |
| `OPENAI_TIMEOUT_MS`             | Server-only tuning        | Optional                   | Optional           | Request timeout, 1,000-120,000; default 30,000.                                 |
| `OPENAI_MAX_RETRIES`            | Server-only tuning        | Optional                   | Optional           | Transient retries, 0-1; default 1.                                              |
| `ANALYSIS_DAILY_LIMIT`          | Server-only tuning        | Optional                   | Optional           | Real model calls per user per UTC day; default 20.                              |
| `ANALYSIS_BATCH_LIMIT`          | Server-only tuning        | Optional                   | Optional           | Maximum thread IDs accepted per batch; default 10.                              |
| `REPLY_DAILY_LIMIT`             | Server-only tuning        | Optional                   | Optional           | Real reply generations per user per UTC day; default 20.                        |
| `GMAIL_LOOKBACK_DAYS`           | Server-only tuning        | Optional                   | Optional           | Gmail search lookback; default 30.                                              |
| `GMAIL_MAX_THREADS`             | Server-only tuning        | Optional                   | Optional           | Hard thread fetch cap; default 50.                                              |
| `THREAD_MAX_CHARACTERS`         | Server-only tuning        | Optional                   | Optional           | Normalized text cap; default 12,000.                                            |
| `DATA_RETENTION_HOURS`          | Server-only tuning        | Optional                   | Optional           | Normalized-content retention window; default 24.                                |

Demo mode requires no Supabase, Google, or OpenAI credentials. A deployed demo should still set
`NEXT_PUBLIC_APP_URL=https://YOUR_PRODUCTION_DOMAIN` so fixed redirects use the deployed origin.
Real mode fails environment validation when a required provider value is absent.

## Exact callback formats

- Supabase application callback, local: `http://localhost:3000/auth/callback`
- Supabase application callback, production: `https://YOUR_PRODUCTION_DOMAIN/auth/callback`
- Gmail OAuth callback, local: `http://localhost:3000/api/gmail/callback`
- Gmail OAuth callback, production: `https://YOUR_PRODUCTION_DOMAIN/api/gmail/callback`
- Supabase provider callback configured in Google Cloud:
  `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`

Supabase Auth and Gmail OAuth are separate clients and separate permissions. The Supabase Google
provider establishes the application session. The Gmail client requests identity scopes plus only
`https://www.googleapis.com/auth/gmail.readonly`.

## Vercel placement

Add all variables through Project Settings > Environment Variables. Treat every value except the
three `NEXT_PUBLIC_*`/`DEMO_MODE` configuration values as server-only. Do not use `vercel env pull`
into a tracked path; Vercel's `.vercel/` and all `.env*` files other than `.env.example` are ignored.
Use different secrets for Preview and Production when possible.
