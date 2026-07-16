# Setup

## Local demo

Copy `.env.example` to `.env.local`, keep `DEMO_MODE=true`, then run `npm install` and `npm run dev`.

## Supabase

Create a project, copy the project URL, publishable/legacy anon key, and server secret/legacy
service-role key. Put only the public URL and public key in `NEXT_PUBLIC_*`; keep the server key
private. Link the CLI, run `npx supabase db push`, inspect `npx supabase db advisors`, confirm every
public table has RLS, and test ownership with two users. Enable Google Auth, add
`http://localhost:3000/auth/callback` and the production equivalent to redirect URLs.

## Google Cloud

Enable Gmail API, configure the consent screen, add test users, and create Web OAuth credentials.
Register `http://localhost:3000/api/gmail/callback` and
`https://YOUR_DOMAIN/api/gmail/callback` exactly. Configure only `openid`, `email`, `profile`, and
`https://www.googleapis.com/auth/gmail.readonly`. Copy the client ID and secret into server-only
variables. Testing-mode refresh-token restrictions and restricted-scope verification requirements
apply; use a dedicated test mailbox. See `docs/GOOGLE_OAUTH.md` for troubleshooting and lifecycle details.

## OpenAI

Create an API key, configure API billing or credits and a low project limit, set an available
`OPENAI_MODEL`, and remember API billing is separate from ChatGPT. Use demo mode without a key.

Generate secrets with Node:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Use the first output for `TOKEN_ENCRYPTION_KEY`; use independent second outputs for OAuth secrets.

## Vercel

Import the GitHub repository, add environment variables, deploy in demo mode first, register the
production Google and Supabase callback URLs, then test real mode with a dedicated account. No
deployment or cloud-resource creation is performed by this repository setup.
