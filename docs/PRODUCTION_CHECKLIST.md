# Production checklist

This checklist is intentionally manual. Do not mark an item complete based only on static review.
Use dedicated test accounts and never place tokens, email bodies, prompts, or drafts in screenshots
or logs.

## Pre-deployment

- [x] Rotate every previously exposed Supabase privileged secret and revoke the old value.
- [x] Confirm `.env`, `.env.local`, `.env.*.local`, `.vercel/`, OAuth client downloads, and logs are untracked.
- [ ] Configure the variables in `docs/ENVIRONMENT.md`; verify server secrets have no `NEXT_PUBLIC_` prefix.
- [x] Run `npm ci`, `npm run check`, `npm run test:e2e`, and `npm audit --omit=dev --audit-level=high`.
- [ ] Run the repository secret, Gmail-write, dangerous-HTML, no-green, and textual-pillbox scans.
- [x] Link the intended non-production Supabase project and review `npx supabase migration list` before pushing.
- [x] Apply migrations in filename order with `npx supabase db push`; do not edit an applied migration.
- [x] Run `npx supabase db lint --linked --fail-on error` and Supabase Database Advisors.
- [x] Confirm RLS is enabled and browser mutation grants are revoked for every server-managed table.
- [x] Run the two-user isolation checks below before using real email data.
- [ ] Set Supabase Site URL to `https://YOUR_PRODUCTION_DOMAIN`.
- [ ] Add `https://YOUR_PRODUCTION_DOMAIN/auth/callback` to the Supabase redirect allowlist.
- [ ] Configure the Supabase Google provider callback in Google Cloud:
      `https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback`.
- [ ] Enable Gmail API and configure the dedicated Gmail OAuth web client.
- [ ] Register `https://YOUR_PRODUCTION_DOMAIN/api/gmail/callback` exactly in Google Cloud.
- [ ] Confirm the consent screen requests only `openid`, `email`, `profile`, and `gmail.readonly`.
- [ ] Set a low OpenAI project budget, a supported `OPENAI_MODEL`, and production daily limits.
- [ ] Import the repository into Vercel, select the intended production branch, and set Node 22 or another supported Node >=20.9.
- [ ] Deploy to Preview first and inspect build output for missing configuration without printing values.

## Post-deployment smoke test

- [ ] Landing page and logo load over HTTPS with no console error.
- [ ] Credential-free demo opens, navigates, resets deterministically, and makes no provider call.
- [ ] Supabase Google sign-in succeeds and `/auth/callback` establishes a protected session.
- [ ] A signed-out request to a dashboard route redirects to `/login`; logout clears the local session.
- [ ] Gmail connect uses a dedicated consent screen and reports read-only access.
- [ ] Gmail status never returns access tokens, refresh tokens, encrypted payloads, or internal IDs.
- [ ] Explicit sync fetches only recent threads; no write, attachment-download, or full-mailbox action occurs.
- [ ] Thread list/search/detail render normalized plain text and safe attachment metadata only.
- [ ] Single and batch analysis run only on explicit actions; cache hits do not consume quota.
- [ ] Evidence links to valid source message IDs; prompt-injection fixture remains inert data.
- [ ] Manual task creation, analysis acceptance, deduplication, edit, complete, reopen, and delete work.
- [ ] Reply Studio creates a grounded copy-only draft; Copy works and no Send control exists.
- [ ] Dashboard loads without Gmail/OpenAI requests or mutations.
- [ ] Settings persist supported preferences without triggering sync or analysis.
- [ ] Gmail disconnect removes local credentials even when remote revocation is unavailable.
- [ ] Account JSON export excludes tokens and secrets; disposable-account deletion removes owned data.
- [ ] Error responses contain stable codes/request IDs and no provider bodies, content, or stack traces.
- [ ] Inspect Vercel and Supabase logs using metadata only; verify no email body, token, prompt, or draft appears.
- [ ] Smoke test 360x800, 390x844, 768x1024, 1024x768, 1280x800, 1440x900, and 1920x1080.
- [ ] Verify keyboard navigation, visible focus, skip link, labels, mobile navigation, and reduced motion.

### Hosted Auth verification — 2026-07-17

- [x] Confirm the rotated Google client secret is active in Supabase (operator confirmation).
- [x] Confirm the Vercel Preview reaches Google's account chooser without a browser console error.
- [x] Confirm the OAuth state cookie uses `HttpOnly`, `Secure`, and `SameSite=Lax`.
- [ ] Complete Google callback with disposable User A.
- [ ] Complete Google callback with disposable User B.
- [ ] Confirm both sessions survive refresh and load protected routes.
- [ ] Confirm logout and signed-out redirects for both users.
- [ ] Confirm bidirectional application-data isolation and safe 403/404 API responses.
- [ ] Inspect the resulting Vercel and Supabase Auth logs without recording identifiers or credentials.

Do not select a personal Google account by assumption. PR #10 remains Draft until every unchecked hosted
Auth item above passes.

## Two-user isolation

Use two disposable authenticated users in a non-production project. Create distinct owned records for
each user, then repeat every read with user A using user B's opaque ID and vice versa.

- [x] User A cannot read or mutate user B's Gmail connection or OAuth state.
- [x] User A cannot see user B's threads or normalized content.
- [x] User A cannot see user B's analyses or cache entries.
- [x] User A cannot see, link, update, complete, or delete user B's tasks.
- [x] User A cannot see or delete user B's reply drafts.
- [x] User A cannot see user B's dashboard aggregates, usage, or activity.
- [ ] User A cannot read or update user B's profile/settings or export user B's account.
- [ ] Cross-user identifiers return the same safe not-found response as missing identifiers.
- [ ] Atomic analysis and reply reservations stop exactly at each user's UTC-day limit under concurrency.

Record project, date, commit SHA, tester, and pass/fail evidence without sensitive content before
approving production traffic.
