# Codex development handoff — Inb0x Labs

Owner: solo founder. Product: Inbox Zero AI by Inb0x Labs. Domain: https://inb0x.my.
The later 12 October 2026 stabilization request supersedes older main-only development.

Latest execution authority and evidence: [FREE_TIER_RELEASE.md](FREE_TIER_RELEASE.md).
The founder authorized non-paid preparation: main protection is applied, automatic Vercel
Production domain assignment is disabled, and a private encrypted database backup passed a
local isolated restore. No merge/promotion occurred. Commercial Hobby launch remains blocked.

## Start here

Read AGENTS.md, PROJECT_RULES.md, scoped instructions, STABILIZATION_REPORT.md and
RELEASE_RECOVERY.md. Preserve DESIGN_RULES.md and the approved premium marketing motion.
Inspect status, refs and PRs before editing; use the latest complete approved application
as a feature-branch base. Never force-push or discard unrelated work.

## Preserved application and deployment

- Approved design: cda3eff200818fddc567c517f8161f5395246096 on codex/premium-marketing-experience;
  a588d78 remains an ancestor. PR #21 is retained.
- Production artifact: 3yL2j31cougWxjPp1eF9LB19RQgV, source cda3eff, Ready. The owner promoted
  it separately; this stabilization work does not replace it.
- Remote main remains incomplete at 95e56fa. Main recovery is an owner-approved release,
  not a routine push or branch rename.
- Candidate: codex/production-stabilization. Review its focused fixes against cda3eff and
  the full application recovery diff against main.
- The original Downloads checkout has pre-existing deletions. Do not reset it. Work is
  in the attached managed worktree; verify paths before commands.

## Candidate corrections and verification

The candidate fixes UTC/date hydration, recent relative-time hydration races, Google
identity-scope aliases and extra-scope rejection, safe identity callbacks, demo Gmail
callback isolation, stale Preview redirects, limiter retention and self-resetting demo
budgets. It pins Node 22.x and adds compatible CSP, public SEO metadata and Preview/private
noindex behavior. API contracts and the approved design remain intact.

Formatting, lint, TypeScript, 248 unit/integration tests, build and 38 E2E checks passed
locally. Re-run relevant checks for new edits. Project .npmrc disables install hooks;
optional native packages suffice for the application build. The installed Supabase 2.109.1
CLI runs through its Node entrypoint and was verified without enabling install hooks.
Do not run npm audit fix --force to hide the known development-only advisory chain.

## Hosted boundaries

Vercel Production and Supabase GitHub production synchronization both track main.
A main merge can affect both systems. Supabase automatic PR database branching is disabled.
Do not merge/push main, promote/roll back, change hosted settings, apply migrations,
modify DNS/billing or activate integrations without explicit owner approval.

Production stays DEMO_MODE=true and NEXT_PUBLIC_APP_URL=https://inb0x.my. Live health
reports database/OpenAI/Google OAuth unconfigured. The correct Inb0x Supabase project is
dsohdhwjzsxuppjbynxs; Spenza is outside scope. Read-only metadata verified RLS, narrow
grants, server-only quota RPCs and six matching migrations. Real two-user/session/account
lifecycle and provider tests remain unverified. Auth URLs still name old Preview/local callbacks.

Gmail is read-only; replies are copy-only. No sending, Gmail drafts, mailbox mutation,
attachment downloads, automatic analysis, paid test traffic or silent task acceptance.
Email remains inert text. Never log secrets, prompts, message content or provider detail.

## Owner approval gates

See RELEASE_RECOVERY.md for branch protection, exact callbacks, Hobby commercial-use
considerations, mail/DNS concerns, real-mode setup and rollback. The index proposal is
outside supabase/migrations and was not applied. Distributed burst limiting and scheduled
retention remain real-mode gates. Production still exhibits the example-thread hydration
error until the owner approves the corrected candidate. Demo tests do not approve release.
