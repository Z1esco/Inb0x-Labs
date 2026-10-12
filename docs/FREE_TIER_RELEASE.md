# Free-tier release execution — 12 October 2026

This record supersedes the proposed safeguards and missing-backup status in the earlier
stabilization/preflight reports. It does not authorize a commercial Production release.

## Preserved candidate

Branch `codex/production-stabilization` continues from reviewed commit
`eec669e92770ee0ebf00a47796b0ad22c3fe477b`. PR #22 remains a draft targeting main.
Approved redesign `a588d78`, all historical commits and other branches remain intact.
No application UI, authentication contract, API, migration or live-provider behavior is changed
by this preparation pass. No paid infrastructure, add-on, billing action or new account was used.

## Safeguards applied

- GitHub main protection is now applied: up-to-date `quality` check, PR requirement,
  admin enforcement, and blocked force pushes/deletion. Zero external approvals preserves
  the solo founder's ability to merge; this does not independently enforce human consent.
- Vercel automatic custom Production domain assignment is now **disabled** and was verified
  after a reload. Future Production builds need manual promotion to receive custom domains.
- Candidate `vercel.json` disables automatic Git deployments while hosting eligibility is
  unresolved. This preparation commit can therefore be pushed without publishing another
  commercial-purpose deployment. The existing verified Preview remains available and serves
  the same unchanged application source at eec669e. Manual deployment remains an owner action;
  this setting is not a provider-policy exemption or an authorization to deploy manually.
- Production Branch remains main. Current serving artifact remains
  `3yL2j31cougWxjPp1eF9LB19RQgV`, source `cda3eff`; it is not the new candidate.
- Supabase main synchronization remains enabled. A main merge still invokes it independently
  of Vercel's traffic gate. Automatic PR database branching remains disabled.
- New ignore patterns help prevent encrypted dumps, raw backup archives and protected keys
  from being accidentally tracked. Actual recovery materials are outside the repository.

## Encrypted logical database recovery

Private location: `C:\Users\ahilm\.codex\private\inb0x-recovery`.
Do not upload this directory to GitHub, CI artifacts, issues, PRs or this chat.

The authenticated local Supabase CLI linked only project `dsohdhwjzsxuppjbynxs`.
Temporary CLI login credentials were passed in memory to standard PostgreSQL tools,
never printed or written to plaintext files. No database password reset was needed.
Connection uses the owner's IPv4 session pooler, `sslmode=verify-full`, and the official
Supabase CA downloaded from the authenticated project's Database Settings link.

- `database.dump.enc`: one consistent PostgreSQL custom-format schema/data snapshot covering
  public, private, auth, storage and supabase_migrations.
- `roles.sql.enc`: cluster roles and membership definitions; role passwords deliberately omitted.
- `manifest.json`: component hashes, encryption roundtrip results and isolated-restore evidence.
- `recovery-key.dpapi`: AES-256-GCM key protected by Windows CurrentUser DPAPI.
- `recovery.py`: private extraction/restoration runner; it never prints SQL or credentials.

Ciphertext is authenticated with a unique nonce and project/component context. Encryption
roundtrip, changed-ciphertext rejection and wrong-context rejection were checked. SQL/archive
plaintext stays in memory and stdin pipes. Files inherit the private directory's restricted ACL.

The restoration uses an official PostgreSQL 17 image pinned by digest, network mode none,
no published ports, no host data mounts and temporary in-memory database storage. The temporary
container is removed afterwards. The original encrypted roles SQL remains intact; the isolated
test normalizes role-grant provenance to its different local bootstrap administrator while
retaining membership/options. This is not an assertion that managed platform roles may be
blindly replaced in a hosted Supabase project.

Verified result: all **46 selected-schema table row counts** match the hosted metadata;
**16 source roles** are present in the restored cluster. All **10 public tables have RLS**,
and all **six migration records** restore. Auth users and Storage objects are both zero.
The two encrypted components also match their recorded plaintext SHA-256 hashes after decryption.
The isolated container was removed after verification. No hosted restore or application-table
write was performed; the CLI used its temporary login mechanism for the read-only dump.

Recovery limits: this is a logical database backup, not a full Supabase service clone. It does
not back up provider settings, external OAuth/OpenAI secrets, infrastructure or Storage object
bytes. Storage objects were checked separately by count. Windows DPAPI recovery currently
depends on this user's Windows profile; a portable, separately secured key escrow and off-site
copy remain owner tasks. Managed platform/internal schemas and extension binaries are supplied
by the destination platform, not recreated from the application archive. Live restore or key
rotation requires separate approval; never run this runner against a hosted restore target.

## Free-tier compliance and blockers

Vercel Hobby and Supabase Free are retained. Vercel's current rules prohibit commercial use,
including advertising a product/service. Inb0x's stated SaaS/marketing purpose makes commercial
public launch on Hobby ineligible even when DEMO_MODE=true and no payment is collected.
Personal, genuinely non-commercial testing is the only authorized Preview use. Merely calling
a commercial deployment a preview does not change its purpose.

Do not merge/promote this candidate for commercial launch on Hobby. Do not remove paid features,
conceal commercial intent, upgrade billing or change DNS to evade the policy. A separately
approved compatibility trial on a commercial-permitted free host is the next infrastructure
decision for public launch; preserve Vercel Hobby for eligible testing and Supabase Free.
No alternate host is configured or claimed compatible by this pass.

The existing public domain still serves the older artifact; its continued availability does
not establish commercial-use eligibility. Its known thread hydration defect remains until an
approved compliant release. No takedown or domain change was authorized or executed here.

The braces advisory still has no compatible published patched version. Five high development
dependency findings remain through the Next ESLint glob chain; production audit has zero.
Lint runs against trusted repository paths, not public request input. No forced downgrade,
unreviewed fork or local dependency patch is used to hide the finding.

## Release and rollback procedure

1. Resolve hosting eligibility first; keep PR #22 draft and do not publish commercial traffic.
2. Record exact candidate SHA, passing CI, serving artifact, environment scopes and private
   recovery manifest. Verify main protection and manual domain promotion are still active.
3. Before an explicitly approved main merge, compare the six hosted migration versions again.
   This candidate adds no migration and has no declared Edge Functions or Storage buckets.
   Supabase production synchronization should be a no-op; stop on any unexpected pending SQL.
4. Use a normal merge commit to preserve ancestry. No reset, force push, branch deletion or
   unrelated PR closure. A main merge still builds Production and invokes Supabase.
5. Inspect build and synchronization logs. Verify a Production-context build with DEMO_MODE=true,
   NEXT_PUBLIC_APP_URL=https://inb0x.my and no live-provider credentials. Do not promote a Preview
   artifact as a substitute for checking Production-context behavior.
6. Smoke-test home, login, dashboard, inbox/thread, tasks, replies, insights and settings;
   check GET /api/health, disabled Gmail connection, fixed-origin auth redirect, missing-route
   errors, headers, robots/sitemap, keyboard/mobile navigation and hydration logs. Use fictional
   data only. Explicit approval is still required before traffic assignment.
7. After an approved compliant release, repeat GET-only checks on apex/www. If it fails, obtain
   rollback approval and restore the recorded previous eligible artifact. On Hobby, Instant
   Rollback is limited to the immediately previous eligible deployment. Recheck automatic
   domain assignment after promotion/rollback; do not silently re-enable it.
8. Vercel rollback does not undo database changes. If database recovery is necessary, preserve
   the failed state, validate the encrypted backup in isolation, review managed-schema/role
   compatibility and obtain separate hosted-restore approval. Never reset live databases or
   blindly replay old migrations. Role passwords and external provider configuration need
   separately approved recovery; the logical archive does not restore them.

## References

- [Vercel commercial-use rules](https://vercel.com/docs/limits/fair-use-guidelines#commercial-usage)
- [Vercel automatic Git deployment control](https://vercel.com/docs/project-configuration/git-configuration)
- [Supabase logical backup/restore](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase TLS verification](https://supabase.com/docs/guides/platform/ssl-enforcement)
- [Supabase production synchronization](https://supabase.com/docs/guides/deployment/branching/github-integration)
- [Vercel rollback limits](https://vercel.com/docs/instant-rollback)
- [Unpatched development advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
