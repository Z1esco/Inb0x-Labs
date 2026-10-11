# Codex development handoff · Inb0x Labs

**Owner:** Solo founder. **Integration:** develop. **Project:** Inb0x / Inbox Zero AI by Inb0x Labs. **Acquired domain:** `inb0x.my` (Exabytes, DNS/live deployment not verified).

## Start here

1. Inspect git status, remote branches, open PRs, working-tree changes and latest develop. Never overwrite local work.
2. Read docs/DOMAIN_DEPLOYMENT.md for the acquired `inb0x.my` domain. Do not assume it is live, edit DNS records, purchase hosting or deploy without founder approval.
3. Read PROJECT_RULES.md, AGENTS.md, DESIGN_RULES.md, docs/OWNERSHIP.md, docs/ARCHITECTURE.md, docs/SECURITY.md, docs/FRONTEND_ARCHITECTURE.md, docs/DESIGN_SYSTEM.md, docs/MOTION_SYSTEM.md, docs/ACCESSIBILITY.md.
4. Read the premium design and implementation documents supplied by the founder. They were prepared outside GitHub; ask for paths only if genuinely unavailable in the workspace. The original specimen was at .superpowers/brainstorm/1270-1784380033/content/06-saas-system.html.
5. Establish baseline npm run check and applicable Playwright tests, recording actual failures without destructive cleanup.

## Current candidate and next objective

The dark attention workbench is implemented on `codex/dark-attention-workbench`, stacked above the documentation and security branches. Read QA_2026-10-11.md for exact evidence. DESIGN_RULES.md and DESIGN_SYSTEM.md now agree; the original local HTML specimen was unavailable, and historical PR #12 was reviewed without merging its conflicting implementation.

Next: founder review of the stacked draft PRs, followed by dedicated-account hosted security verification and durable request-burst limiting before real-user beta. Preserve routes, Supabase auth, APIs, demo fixtures, read-only Gmail, explicit analysis/task acceptance and copy-only replies. Do not repeat the redesign or deploy production without approval. The founder authorized automatic Preview deployments only on 11 October 2026.

## Mandatory safety

Never introduce Gmail send, Gmail drafts, archive, delete, label changes, attachment downloads, autonomous agents, background analysis, automatic reply generation or silent tasks. Do not weaken RLS, auth, ownership, token encryption, rate limits or AI grounding. Never log raw email, prompts, drafts or credentials. Never run real provider tests without a dedicated authorized account. Keep shared API contracts unchanged unless agreed explicitly.

## Working style

- For each task: inspect -> plan -> implement -> test -> review -> report.
- Prefer existing components and dependencies; evaluate accessibility and bundle cost before proposing Base UI, Phosphor, Motion or Recharts.
- Use focused Conventional Commits and draft PRs to develop. Never self-merge or deploy.
- Report branch, files changed, contracts, schema, tests, screen sizes, security checks, failures, outstanding founder actions and next task.
- Ask before any paid service, destructive database change, production deployment, license change or GitHub visibility change.
- Do not claim production readiness without hosted verification.

## Suggested opening instruction to Codex

> Continue Inb0x Labs as a solo-founder SaaS. Read AGENTS.md and the repository rules first. Inspect current branches and local state. Treat the premium attention workbench as the approved design direction, compare the provided specimen, reconcile design tokens, and execute the staged redesign without altering business behavior. Start with a baseline audit and one small feature branch. Show evidence for every check. Do not merge or deploy.
