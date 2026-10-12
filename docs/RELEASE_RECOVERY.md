# Main recovery, release gate and rollback

**Execution update:** [FREE_TIER_RELEASE.md](FREE_TIER_RELEASE.md) supersedes the proposed
protection, automatic-domain-assignment and missing-backup states below. Main protection is
applied, automatic Production domain assignment is disabled, and an encrypted logical backup
passed an isolated local restore. Commercial public launch remains blocked by Hobby policy.
The older preserved-state and rollback artifact details below remain useful history.

## Preserved state

- Approved application: `cda3eff200818fddc567c517f8161f5395246096` on
  `codex/premium-marketing-experience`, preserving `a588d78` as an ancestor.
- Candidate: `codex/production-stabilization`, branched directly from that approved commit.
- Remote main: `95e56fa83ff1290a1acde42142fbec0d7ae77e82`; it contains only the initial
  repository files, without the application or package.json. No main push was performed.
- The owner promoted the approved marketing Preview to Production separately from GitHub.
  The live site remains on its existing artifact throughout this work.
  Verified serving deployment: `3yL2j31cougWxjPp1eF9LB19RQgV`, source cda3eff, Ready.

## Verified automatic deployment paths

Vercel Production tracks **main**, with automatic domain assignment enabled. Root Directory
is empty (repository root), framework is Next.js, and command overrides are disabled.
The dashboard setting is Node 24.x, but the candidate's **22.x** package engine overrides
it for candidate builds. CI and .nvmrc also use 22; no Vercel setting was changed.
Preview tracks all unassigned branches and has no custom domains.

Supabase's GitHub integration also tracks **main** with **Deploy to production enabled**.
Automatic PR database branching is disabled (not available on the current plan). This
means opening a draft recovery PR is safe, but **merging main can affect both Vercel and
the hosted database**. All six existing migration versions already match the hosted project;
this candidate adds no migration in supabase/migrations. Do not infer that a merge is approved.

## Prepared protections and main repair

The draft recovery PR targets main and contains the full application plus the stabilization
fixes. Compare its focused stabilization changes against cda3eff separately from the full
recovery diff. Keep PR #21 and historical branches intact; do not force-push or rewrite history.

`.github/main-protection.proposed.json` is a proposal, **not an applied setting**. After owner
approval, apply it to require an up-to-date `quality` check and PRs, block force pushes/deletion,
and enforce the rules for admins. Zero external reviewer approvals avoids locking out the solo
founder; the founder must still explicitly approve this release before the merge is executed.
CI now covers codex branches as well as PRs, uses Node 22, disables install hooks, cancels
superseded runs and has a 20-minute timeout. Require the candidate PR's actual successful run.

The public repository currently reports main as unprotected. Local CI configuration cannot
enforce remote branch rules or prevent an authorized operator from promoting a deployment.
Protection application and any change to automatic Production promotion require approval.

## Owner approval checklist before any release

1. Review the exact candidate commit, full recovery diff, focused fixes, tests and Preview.
2. Approve applying branch protection and decide whether automatic Production assignment
   should remain enabled. Do not change that setting as a workaround for missing approval.
3. Confirm the existing Production deployment ID in Vercel and record it before merging.
4. Approve the recovery merge explicitly, acknowledging both Vercel and Supabase main hooks.
5. Keep Production `DEMO_MODE=true` and `NEXT_PUBLIC_APP_URL=https://inb0x.my`. No real provider
   credentials or environment changes belong to this public-demo release.
   Release using a Production-context build; do not assume a Preview artifact carries Production
   configuration. Check that /api/auth/google redirects to https://inb0x.my/dashboard before
   assigning traffic. Preview demo redirects intentionally remain on their own deployment.
6. Resolve the Hobby commercial-use restriction with the owner before commercial use. Billing
   changes are separate approvals; no upgrade was performed.
7. Do not include `docs/proposals/cover-foreign-keys.sql` in an automatic migration. It is an
   informational performance proposal requiring isolated verification and hosted-change approval.

## Rollback procedure — prepared, not executed

Before release, record the currently serving deployment ID and configuration, not just its
Git SHA. If the candidate fails after an approved release, obtain rollback approval, then use
Vercel's existing deployment rollback/promotion interface to restore that exact prior artifact.
Verify homepage, login, fictional dashboard and example thread with GET-only checks. Keep DNS,
OAuth, environment and database state unchanged. Do not force-reset main or re-run old migrations.

If a reviewed recovery merge must be reverted, create a normal revert PR, run CI and obtain
release approval. This candidate has no database migration, so no schema rollback is required.
Restoring an artifact does not repair GitHub main history; preserve the main recovery work and
investigate before attempting another release.

## Real-mode setup remains a separate release

Supabase project: `dsohdhwjzsxuppjbynxs` (Inb0x-Labs). Its Google identity provider is enabled,
but Site URL and allowed redirects still name the old chore/production-readiness Preview and
localhost. With approval, set Site URL to https://inb0x.my and allow the exact application
callback https://inb0x.my/auth/callback. Keep isolated development callbacks explicitly scoped.

Google's identity-provider callback is https://dsohdhwjzsxuppjbynxs.supabase.co/auth/v1/callback.
The separately configured Gmail OAuth client must allow https://inb0x.my/api/gmail/callback.
Verify the actual Google Cloud client, consent screen, restricted-scope eligibility and secrets
with the owner. Nothing in this work activates Gmail or paid OpenAI traffic.

Before enabling real mode: confirm key rotation, add credentials through approved secret stores,
verify two-user isolation/session refresh/export/deletion in an isolated project, test provider
revocation and retention, implement distributed burst limiting, choose a project-available
Structured Outputs model, confirm budgets and run explicitly approved integration tests.
