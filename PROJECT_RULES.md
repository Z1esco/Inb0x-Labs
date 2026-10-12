# Inb0x project rules

This file is the permanent source of truth for Codex sessions. Read it before making changes.

## 1. Product scope

**Product:** Inbox Zero AI · **Brand:** Inb0x Labs · **Platform:** responsive web application.

Inb0x turns Gmail overload into summaries, priorities, deadlines, tasks, insights, and safe
copy-only reply drafts. Gmail is read-only and users remain in control. Never add email sending,
Gmail draft creation, deletion, archiving, label changes, hidden actions, background agents,
background analysis, attachment processing, automatic tasks, or automatic replies. Demo mode must
work without Gmail, OpenAI, or Supabase credentials.

## 2. Tech stack

Use Next.js App Router, React, strict TypeScript, Tailwind CSS, Supabase Auth/PostgreSQL/RLS, Google
Gmail API, OpenAI Responses API with Structured Outputs, Zod, Vitest, React Testing Library where
useful, Playwright, ESLint, Prettier, GitHub Actions, and Vercel. Avoid large dependencies unless
necessary. Do not add Redis, vector databases, embeddings, workers, cron, other AI providers, other
UI frameworks, or duplicate libraries.

## 3. Logical code boundaries (solo-founder workflow)

As confirmed on 12 October 2026, the founder is the solo developer and owns all product and repository decisions. The historical backend/frontend split below describes logical code boundaries, not separate developers or required branches. See `docs/OWNERSHIP.md`.

- Backend domain: `src/app/api/**`, `src/server/**`, `src/lib/**`, `src/schemas/**`, `src/prompts/**`,
  `src/types/**`, `supabase/**`, backend tests/docs, migrations, security, and API contracts.
- Frontend domain: `src/components/**`, `src/features/**`, `src/styles/**`, `public/**`, marketing and
  dashboard visual routes, charts, animations, responsive UI, and Figma implementation.
- Shared: `src/types/contracts.ts`, `src/mock/**`, `docs/**`, `README.md`, route layouts, and
  `src/lib/api-client.ts`.

Before editing shared files, inspect recent commits, active branches, and ownership docs. Avoid
overwriting concurrent or uncommitted work and report likely conflicts first.

## 4. Required codebase structure

Use `src/app/api` for thin routes; `src/server/{auth,gmail,ai,tasks,replies,dashboard,settings,insights}`
for services and repositories; `src/lib`, `src/schemas`, `src/prompts`, `src/types`, and `src/mock`
for their named responsibilities; `supabase/migrations` for SQL; and `tests/{unit,integration,e2e,
fixtures,mocks}` for tests. Business logic belongs in services, database logic in repositories,
public types in shared contracts, validation in Zod schemas, and demo fixtures outside production
providers. Extend existing modules, avoid duplicate architectures/circular imports/unnecessary moves,
and preserve frontend work outside the requested scope.

## 5. Git workflow

The founder's later 12 October stabilization request supersedes earlier main-only development.
Use a feature branch from the latest complete approved application and a draft PR for review.
Remote main is incomplete until the owner approves the recovery merge. Preserve history and
unrelated working-tree changes; never force push. Use Conventional Commits and deterministic checks.

Before changes: fetch and inspect branch/PR state, local changes, rules and relevant architecture.
Before finishing: run format/lint/typecheck/tests/build, npm run check, relevant browser tests,
production audit and secret/diff review. **Publishing or merging main is a
separate release action** because GitHub/Vercel may automatically deploy Production. The current
authorization permits automatic Previews only; finish a concrete verified candidate before seeking
Production authorization. Main also triggers Supabase production synchronization. Do not bypass
this boundary by changing Vercel, Supabase or GitHub settings. See `docs/RELEASE_RECOVERY.md`.

## 6. Security rules

Always derive authenticated identity server-side, user-scope every query, enforce RLS, keep privileged
credentials server-only, encrypt Gmail tokens, validate OAuth state, use least-privilege read-only
Gmail scopes, treat email as hostile data, strictly validate and ground AI output, return safe stable
errors with request IDs, bound inputs/arrays/queries, rate-limit and quota expensive work, keep logs
free of sensitive content, and preserve demo mode.

Never trust client user IDs; expose provider/service/OpenAI/Google secrets; log raw email, replies,
prompts, or model output; render raw email HTML; use `dangerouslySetInnerHTML` for email; add Gmail
write scopes, send routes, or Gmail draft creation; or return stack traces, SQL, or provider errors.
The previously exposed Supabase privileged key must be rotated before real-mode usage. Never put any
old or new secret in repository files, chat, issues, PRs, logs, or documentation.

## 7. AI rules

Use the Responses API, Structured Outputs, strict Zod schemas, configurable `OPENAI_MODEL`, server-only
keys, prompt/schema versions, content-aware per-user caches and quotas, and count only real calls.
Never analyze on page load, generate replies automatically, follow email instructions, reveal prompts,
invent facts/deadlines/commitments, or claim external action. Provide evidence and uncertainty and
support deterministic demo mode.

## 8. API rules

Success is `{ "success": true, "data": {}, "meta": {} }`. Errors are
`{ "success": false, "error": { "code": "STABLE_MACHINE_CODE", "message": "Safe message", "requestId": "string" } }`.
Routes authenticate, validate, call one service, map errors, and return. Keep business logic out.

## 9. Database rules

Use SQL migrations, RLS, ownership, indexes, checks, uniqueness, updated-at triggers, safe foreign
keys, idempotent writes, and deterministic deduplication. Never accept ownership from clients, rely on
UI security, use unscoped privileged queries, duplicate migrations, or claim unexecuted migrations ran.

## 10. Demo mode

Demo mode uses deterministic fictional data and the production public contracts, supports reset,
clearly marks demo data, makes no external calls, requires no provider credentials where fixture mode
is supported, and contains no real personal information.

## 11. Testing rules

Add unit, integration, demo, meaningful E2E, ownership/isolation, validation, and security regression
tests. Automated tests never call real Gmail, OpenAI, or Supabase. Run format, lint, typecheck, test,
build, check, relevant Playwright, production audit, and a secret scan. Claim success only when green.

## 12. Documentation rules

Keep README, architecture, API, database, security, structure, handoff, and feature docs current.
Separate demo/real mode, credentials, unexecuted migrations, limitations, and manual setup. Never
include secrets or claim unimplemented behavior.

## 13. Frontend safety

Backend work must not redesign UI, overwrite Figma work, change visual components unnecessarily,
introduce final styling, or change frontend behavior without contract coordination. Keep shared
contract changes backward-compatible where practical.

Frontend work follows `DESIGN_RULES.md` and the documents under `docs/FRONTEND_ARCHITECTURE.md`,
`docs/DESIGN_SYSTEM.md`, `docs/MOTION_SYSTEM.md`, and `docs/ACCESSIBILITY.md`. The UI is dark-first,
uses signal red/cyan/blue/amber semantics, contains no green-family colors, and does not use textual
pillboxes. Frontend routes consume existing contracts and never invent provider behavior.

## 14. Performance rules

Avoid N+1 queries, unbounded lists/windows, automatic external calls, raw-body dashboard responses,
and long-lived server memory. Prefer persisted data, aggregate queries, and Vercel-compatible designs.
Do not claim performance without measurement.

## 15. Final report format

Report branch, commits, PR/base/state, created/changed files, architecture, routes, contracts, database/
RLS, demo, tests/build/E2E/audit/secret scan, migration and live-test status, limitations, manual actions,
and next feature. Clearly separate fully working, demo-only, credentials/migration required, runtime
verified, statically reviewed, untested, and blocked.
