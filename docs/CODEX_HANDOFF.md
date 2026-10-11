# Codex development handoff · Inb0x Labs

**Owner:** Solo developer. **Working branch:** main only, explicitly confirmed 12 October 2026.
**Product:** Inbox Zero AI by Inb0x Labs. **Domain:** inb0x.my; DNS/live release not verified.

## Current state

Local main consolidates the previous application, documentation, dependency security and dark
attention-workbench candidate history, plus the V2 Spenza-inspired product website. Older draft
PRs #16–20 remain unmerged historical records. Do not create another branch or PR stack unless
the founder requests it. Do not rewrite or delete old remote history as a side effect.

The original Downloads checkout contains pre-existing tracked deletions. Preserve them. Current
work is in the attached managed worktree; inspect git worktree list and git status before editing.
The local main candidate has not been pushed to origin. Publishing main may automatically deploy
Production; the founder has authorized automatic Preview deployments only. Finish local verification
and present the concrete candidate before seeking Production release authorization.

## Start here

1. Read AGENTS.md, PROJECT_RULES.md, DESIGN_RULES.md, docs/OWNERSHIP.md and relevant architecture.
2. Read V2_FRONTEND_PLAN.md for the current brief, reference research, skill provenance and scope.
   Read QA_2026-10-12.md for current local verification and remaining release gates.
3. Inspect local status, remote refs and historical PRs; preserve unrelated work and existing history.
4. Follow DESIGN_RULES.md as the single visual authority. DESIGN_SYSTEM.md describes implementation.
5. Run npm run check and relevant Playwright tests with fictional data. Report fresh results and gaps.
6. Review docs/DOMAIN_DEPLOYMENT.md and the beta register before any hosted release.

## Implemented V2 frontend

The product website has responsive navigation, actual desktop/phone product captures, a selectable
source-to-action example, evidence/reply/insights stories, a factual read-only trust ledger, FAQ and
demo/sign-in paths. Static composition remains server-rendered; small client islands handle selection
and disclosure. No new runtime dependency or provider call is introduced.

The dashboard derives its queue description from data, including empty and singular states; its
stored-thread total no longer implies that every other thread can wait. Dashboard and Insights share
proportional volume bars with real zero heights and explicit count/date labels. Insights avoids blanket
claims about email urgency. Task and saved-reply deletion ask for confirmation; task editing is labelled.

## Preserve these boundaries

No Gmail send, draft creation, archive, delete, labels, read-state mutations, attachment downloads,
background analysis, automatic reply generation or silent task acceptance. Keep Supabase auth,
ownership, RLS, encrypted tokens, rate limits, quotas, grounding, input bounds, contracts and API client.
Email remains inert text. Real errors never fall back to fixtures. No paid or live-provider routine tests.

No backend, API, contract, schema, migration or provider configuration change belongs to this V2 pass.
Hosted auth/RLS/provider verification, durable burst limiting, secret rotation confirmation, legal
identity and commercial spending decisions remain separate production-readiness gates.

## Working style

Inspect, implement narrowly, verify actual behavior, review the diff and commit on main. Do not split
a solo task by developer role. Keep reports concise and evidence-based. Local demo checks do not prove
hosted auth, real provider behavior, physical-device accessibility or production readiness. Do not
publish main, change DNS, purchase services, run destructive migrations, alter license/visibility or
claim release without the applicable explicit authorization.
