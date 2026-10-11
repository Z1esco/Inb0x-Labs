# Release runbook

## Preview and production approval

The existing GitHub/Vercel integration creates Preview builds. On 11 October 2026 the founder
authorized automatic Preview deployments only. Production promotion, provider changes, migrations,
DNS, purchases and merges require separate approval. Do not re-import or reconfigure a project blindly.

1. Identify the exact reviewed candidate SHA and its dependency PRs. Keep `main` stable and `develop`
   as integration. Draft PRs are not release approval.
2. Run `npm ci`, `npm run check`, `npm run test:e2e`, production dependency audit and source scan.
   Review screenshots, remaining advisories and the current beta gates.
3. Let the authorized integration build Preview. An operator verifies its actual project/environment,
   `DEMO_MODE=true`, exact Preview origin, no provider secrets, access protection and no indexing.
   Existing Preview URLs redirect anonymous checks to Vercel authentication; do not bypass protection.
4. Run fictional hosted smoke checks as an authorized operator. Record actual application results,
   headers and candidate SHA. A green deployment status or Vercel login page is not app verification.
5. Before real mode, obtain founder approval for the dedicated test environment and any additive
   migration. Inspect existing hosted schema and migration history; never assume an empty database.
   Rotation, RLS/grants, two-user denial, quotas, export/deletion and rollback evidence are mandatory.
   Do not run `supabase db push` merely because it appears in an older checklist.
6. Review legal/operator/support details, Google restricted-scope consent requirements, commercial
   hosting eligibility and spending controls. No purchase or broad beta is authorized by local QA.
7. After production approval, configure only the approved production environment and exact provider
   callbacks described in DOMAIN_DEPLOYMENT.md. Set `NEXT_PUBLIC_APP_URL=https://inb0x.my` only after
   domain/HTTPS verification. Preserve email DNS records and retrieve actual host records from Vercel.
8. Promote only the reviewed SHA after BETA_READINESS.md and the current production checklist pass.
   Turning `DEMO_MODE=false` is a separate real-mode cutover; rehearse recovery before real users.

No `vercel.json` is required: Vercel detects the Next.js App Router project, `package.json` pins the
Node engine floor, and `package-lock.json` is the dependency lock. Environment values belong in the
Vercel dashboard, not source control.

## Rollback

1. Stop new traffic by switching the domain to the last known-good Vercel deployment or use Vercel's
   instant rollback.
2. If provider behavior is suspect, set `DEMO_MODE=true` and redeploy to remove live Supabase, Gmail,
   and OpenAI calls while preserving the fictional demo experience.
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

The current PR #10 verification record is in `docs/RELEASE_VERIFICATION_2026-07-17.md`.
