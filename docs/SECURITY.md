# Application security and threat model

The root `SECURITY.md` describes responsible disclosure. This document records implementation
controls. Gmail is read-only, credentials remain server-side, tokens use AES-256-GCM, OAuth state
is random/hashed/user-bound/expiring/single-use, inputs and AI outputs are strict, email HTML is converted to inert text,
attachments are never downloaded, and logs must use an allowlist.

| Threat                                  | Control                                                                                           |
| --------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Stolen refresh token / secret leakage   | Authenticated encryption, server-only variables, redacted logs, immediate local deletion          |
| OAuth CSRF / replay                     | Keyed state hash, HTTP-only SameSite cookie, user binding, expiry, atomic single-use consumption  |
| Session theft                           | Server validation, no shared request client, no authenticated response caching                    |
| Cross-user access / IDOR                | Server-derived identity, ownership filters, RLS on every user table                               |
| Prompt injection                        | Data delimiter, hostile-angle escaping, strict schema, grounded evidence, sync/model safety flags |
| Malicious HTML / XSS                    | HTML-to-text conversion, scripts/styles/images skipped, React text rendering                      |
| Oversized bodies                        | Configurable 12,000-character default cap                                                         |
| API abuse / spending                    | Per-user action limits, daily AI quotas, bounded batches, explicit triggers, caching, one retry   |
| Hallucination                           | Evidence, confidence, nullable/empty unknowns, manual review                                      |
| Sensitive logs                          | No content, tokens, secrets, cookies, prompts, drafts, or provider errors                         |
| Gmail write access                      | Scope allowlist and absence of write/send code                                                    |
| Hostile or oversized MIME content       | Pre-conversion byte cap, inert text conversion, bounded output, no remote resource fetching       |
| Attachment exfiltration                 | Metadata only; provider attachment IDs and contents are never public or persisted                 |
| Stale concurrent synchronization        | User/thread uniqueness plus timestamp and content-hash optimistic update checks                   |
| Encrypted-token exposure                | Token and OAuth-state tables revoked from browser Data API roles                                  |
| SQL injection                           | Typed Supabase query builder and validated values                                                 |
| Sync races / duplicate tasks            | Unique upsert constraints; task IDs and ownership checks                                          |
| Forged task source                      | Strict bodies, stored-analysis lookup, ownership trigger, bounded evidence                        |
| Concurrent extracted-task creation      | Stable SHA-256 source key plus user-scoped database uniqueness                                    |
| Reply prompt/user-instruction injection | Separate data boundaries, strict output, grounding, warnings, no tools                            |
| Unsupported commitments or payment      | Stored thread authority, unsupported-fact removal, uncertainty, mandatory review                  |
| Cross-user draft/cache access           | Per-user RLS, user-scoped queries/cache key, ownership trigger, opaque not-found                  |
| Sensitive reply logging                 | Drafts, instructions, prompts, evidence, and model output excluded from logs                      |
| Generation abuse                        | Explicit action, per-user rate limit, atomic daily quota, bounded retry, cache                    |
| Accidental email send or Gmail draft    | No write scopes, send route, draft API, write client, or sent-success state                       |

Task action items are untrusted suggestions until a user explicitly accepts them. The browser may
submit only an analysis ID and action index; title, evidence, source message, ownership, source type,
and completion timestamps come from validated server-side state. Task responses omit the internal
source-action key and user ID. Authenticated browser roles have read-only task table grants; strict
server routes perform explicitly user-scoped mutations. Missing and cross-user identifiers share the
same not-found response.

Before production, replace the lightweight request-burst limiter with a distributed implementation,
run Supabase advisors, verify every policy and the atomic usage reservation with two real test users,
rotate any exposed secret, and test deletion against a dedicated Gmail account.

The previously exposed Supabase privileged key must be rotated before any further live migration or
production deployment. Store the replacement only in local `.env.local` and Vercel. Reply drafts use
the stored owned thread as source of truth; user instructions cannot authorize secrets, fake facts,
external actions, sending, or Gmail draft creation. Public contracts are copy-only and always report
`sent: false`.
