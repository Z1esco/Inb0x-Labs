# Release runbook

## Deployment

1. Branch from the latest green `develop`; do not deploy an unreviewed local worktree.
2. Run `npm ci`, `npm run check`, `npm run test:e2e`, dependency audit, and security scans.
3. Rotate compromised secrets before configuring any live environment.
4. Create or select a dedicated Supabase project, link it locally, inspect the migration list, then run
   `npx supabase db push`. Run database lint and Advisors before application traffic.
5. Import `Z1esco/Inb0x-Labs` into Vercel and select the approved production branch.
6. Configure the exact variables from `docs/ENVIRONMENT.md` in Vercel. Start with `DEMO_MODE=true`.
7. Deploy Preview, run the demo E2E/smoke flow, then promote the reviewed build.
8. Configure the production domain and update `NEXT_PUBLIC_APP_URL`.
9. Update Supabase Site URL and redirect allowlist, then configure the Google provider callback.
10. Register the separate Gmail callback URI and verify its consent screen remains read-only.
11. After dedicated-account testing, set `DEMO_MODE=false`, redeploy, and execute
    `docs/PRODUCTION_CHECKLIST.md`.

No `vercel.json` is required: Vercel detects the Next.js App Router project, `package.json` pins the
Node engine floor, and `package-lock.json` is the dependency lock. Environment values belong in the
Vercel dashboard, not source control.

## Rollback

1. Stop new traffic by switching the domain to the last known-good Vercel deployment or use Vercel's
   instant rollback.
2. If provider behavior is suspect, set `DEMO_MODE=true` and redeploy to remove live Supabase, Gmail,
   and OpenAI calls while preserving the judge experience.
3. Revoke or rotate affected provider credentials immediately; do not wait for a code rollback.
4. Preserve request IDs, deployment SHA, timestamps, and safe status metadata for diagnosis.
5. Reproduce in Preview with fictional or disposable data before releasing a fix.

Database migrations are forward-only. A Vercel rollback does not roll back PostgreSQL. Never delete
columns/tables or reverse a data migration during an incident without a reviewed recovery migration
and backup. Prefer additive compatibility migrations and restore from a verified Supabase backup only
with explicit incident-owner approval.

## Secret rotation

1. Revoke the old credential in its provider dashboard.
2. Create a replacement with least privilege.
3. update local `.env.local` and Vercel Preview/Production values without printing the value.
4. Redeploy and smoke test the affected integration.
5. Confirm old credentials fail and no value entered Git history or logs.

Rotate Supabase server keys, Google client secrets, OpenAI keys, `OAUTH_STATE_SECRET`, and
`TOKEN_ENCRYPTION_KEY` independently. Rotating the token-encryption key makes existing encrypted Gmail
connections unreadable; disconnect/reconnect users or provide a reviewed re-encryption procedure.

## Incident response

- Disable real mode with `DEMO_MODE=true` when confidentiality or provider behavior is uncertain.
- Revoke Gmail OAuth credentials or disable the Gmail API client to stop new connections. Existing
  local encrypted tokens must still be deleted through disconnect/account cleanup when safe.
- Revoke the OpenAI API key or remove it from Vercel to stop model calls; demo analysis remains deterministic.
- Use Vercel request logs, Supabase Auth/Database logs, and provider status codes only. Search by request
  ID and time window; never add raw bodies, cookies, authorization codes, tokens, prompts, or drafts to logs.
- Preserve evidence, scope affected users without exposing content, notify the project owner, and document
  recovery actions and rotation times.

## Verification record

For each release record: Git SHA, PR, Vercel deployment URL, environment, migration versions, test counts,
database lint/Advisor status, two-user isolation result, OAuth callback checks, smoke tester, and rollback
deployment. A static code review is not a substitute for live Supabase, Google, OpenAI, or production tests.
