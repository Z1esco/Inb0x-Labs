# Application security and threat model

The root `SECURITY.md` describes responsible disclosure. This document records implementation
controls. Gmail is read-only, credentials remain server-side, tokens use AES-256-GCM, OAuth state
is random/hashed/user-bound/expiring/single-use, inputs and AI outputs are strict, email HTML is converted to inert text,
attachments are never downloaded, and logs must use an allowlist.

| Threat                                  | Control                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Stolen refresh token / secret leakage   | Authenticated encryption, server-only variables, redacted logs, immediate local deletion           |
| OAuth CSRF / replay                     | Keyed state hash, HTTP-only SameSite cookie, user binding, expiry, atomic single-use consumption   |
| Session theft                           | Server validation, no shared request client, no authenticated response caching                     |
| Cross-user access / IDOR                | Server-derived identity, ownership filters, RLS on every user table                                |
| Prompt injection                        | Data delimiter, hostile-angle escaping, strict schema, grounded evidence, sync/model safety flags  |
| Malicious HTML / XSS                    | HTML-to-text conversion, scripts/styles/images skipped, React text rendering                       |
| Oversized bodies                        | Configurable 12,000-character default cap                                                          |
| API abuse / spending                    | Per-user action limits, daily AI quotas, bounded batches, explicit triggers, caching, one retry    |
| Hallucination                           | Evidence, confidence, nullable/empty unknowns, manual review                                       |
| Sensitive logs                          | No content, tokens, secrets, cookies, prompts, drafts, or provider errors                          |
| Gmail write access                      | Scope allowlist and absence of write/send code                                                     |
| Hostile or oversized MIME content       | Pre-conversion byte cap, inert text conversion, bounded output, no remote resource fetching        |
| Attachment exfiltration                 | Metadata only; provider attachment IDs and contents are never public or persisted                  |
| Stale concurrent synchronization        | User/thread uniqueness plus timestamp and content-hash optimistic update checks                    |
| Encrypted-token exposure                | Token and OAuth-state tables revoked from browser Data API roles                                   |
| SQL injection                           | Typed Supabase query builder and validated values                                                  |
| Sync races / duplicate tasks            | Unique upsert constraints; task IDs and ownership checks                                           |
| Forged task source                      | Strict bodies, stored-analysis lookup, ownership trigger, bounded evidence                         |
| Concurrent extracted-task creation      | Stable SHA-256 source key plus user-scoped database uniqueness                                     |
| Reply prompt/user-instruction injection | Separate data boundaries, strict output, grounding, warnings, no tools                             |
| Unsupported commitments or payment      | Stored thread authority, unsupported-fact removal, uncertainty, mandatory review                   |
| Cross-user draft/cache access           | Per-user RLS, user-scoped queries/cache key, ownership trigger, opaque not-found                   |
| Sensitive reply logging                 | Drafts, instructions, prompts, evidence, and model output excluded from logs                       |
| Generation abuse                        | Explicit action, per-user rate limit, atomic daily quota, bounded retry, cache                     |
| Accidental email send or Gmail draft    | No write scopes, send route, draft API, write client, or sent-success state                        |
| Cross-user dashboard metric leakage     | Server identity, explicit user filters, RLS, no client ownership fields                            |
| Aggregate/body/draft leakage            | Safe bounded projections omit all email and reply bodies                                           |
| Unbounded analytics or N+1 abuse        | Seven parallel capped queries, seven-day windows, bounded outputs                                  |
| Timezone and score misuse               | Validated IANA zones, transparent clamped formula, insufficient-data state                         |
| Demo/production or quota leakage        | Explicit demo adapter and per-user usage without reservation internals                             |
| Misleading frontend action state        | Copy-only reply labels, no Send control, explicit task acceptance, and read-only Gmail copy        |
| Unsafe client rendering                 | Plain-text email contracts and no `dangerouslySetInnerHTML`                                        |
| Destructive UI confusion                | Explicit reset/delete hierarchy, safe messages, and keyboard-visible confirmation paths            |
| Cross-user settings or export access    | Server-derived identity, strict schemas, explicit user filters, RLS, safe export projections       |
| Accidental destructive account action   | Exact confirmation phrase, per-user rate limit, server-only Auth Admin call, FK cascades           |
| Credential leakage through export       | Gmail export allowlist excludes provider tokens, encrypted payloads, secrets, and OAuth state      |
| Browser bypass of route validation      | Authenticated mutation grants revoked from server-managed tables; RLS remains defense in depth     |
| Stale Supabase session cookies          | Request proxy verifies the session and propagates refreshed SSR cookies; protected layouts recheck |

Task action items are untrusted suggestions until a user explicitly accepts them. The browser may
submit only an analysis ID and action index; title, evidence, source message, ownership, source type,
and completion timestamps come from validated server-side state. Task responses omit the internal
source-action key and user ID. Authenticated browser roles have read-only task table grants; strict
server routes perform explicitly user-scoped mutations. Missing and cross-user identifiers share the
same not-found response.

Before production, replace the lightweight request-burst limiter with a distributed implementation
and test deletion against a dedicated Gmail account. Hosted Supabase lint, Advisors, table grants,
and two-user row isolation were verified on 2026-07-17 with disposable synthetic accounts.

Settings updates are authenticated, strictly validated, rate-limited, and explicitly scoped by the
server-derived user ID. Account export selects bounded allowlisted fields; it intentionally includes
owned normalized content and generated drafts because it is a user data export, but never credential
material. Account deletion uses the server-only Supabase admin client for exactly the authenticated
Auth user. Production deletion must be manually verified in a disposable test project before launch.

The previously exposed Supabase privileged key was revoked and replaced before the hosted migration
pass. The replacement is stored only in local `.env.local` and branch-scoped Vercel Preview secrets.
Reply drafts use
the stored owned thread as source of truth; user instructions cannot authorize secrets, fake facts,
external actions, sending, or Gmail draft creation. Public contracts are copy-only and always report
`sent: false`.
