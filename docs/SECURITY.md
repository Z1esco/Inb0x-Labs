# Application security and threat model

The root `SECURITY.md` describes responsible disclosure. This document records implementation
controls. Gmail is read-only, credentials remain server-side, tokens use AES-256-GCM, OAuth state
is random/hashed/user-bound/expiring/single-use, inputs and AI outputs are strict, email HTML is converted to inert text,
attachments are never downloaded, and logs must use an allowlist.

| Threat                                | Control                                                                                            |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Stolen refresh token / secret leakage | Authenticated encryption, server-only variables, redacted logs, immediate local deletion           |
| OAuth CSRF / replay                   | Keyed state hash, HTTP-only SameSite cookie, user binding, expiry, atomic single-use consumption   |
| Session theft                         | Server validation, no shared request client, no authenticated response caching                     |
| Cross-user access / IDOR              | Server-derived identity, ownership filters, RLS on every user table                                |
| Prompt injection                      | Email is untrusted data; system prompt forbids following it; strict output schema and safety flags |
| Malicious HTML / XSS                  | HTML-to-text conversion, scripts/styles/images skipped, React text rendering                       |
| Oversized bodies                      | Configurable 12,000-character default cap                                                          |
| API abuse / spending                  | Per-user action limits, daily AI quotas, bounded batches, explicit triggers, caching, one retry    |
| Hallucination                         | Evidence, confidence, nullable/empty unknowns, manual review                                       |
| Sensitive logs                        | No content, tokens, secrets, cookies, prompts, drafts, or provider errors                          |
| Gmail write access                    | Scope allowlist and absence of write/send code                                                     |
| Hostile or oversized MIME content     | Pre-conversion byte cap, inert text conversion, bounded output, no remote resource fetching        |
| Attachment exfiltration               | Metadata only; provider attachment IDs and contents are never public or persisted                  |
| Stale concurrent synchronization      | User/thread uniqueness plus timestamp and content-hash optimistic update checks                    |
| Encrypted-token exposure              | Token and OAuth-state tables revoked from browser Data API roles                                   |
| SQL injection                         | Typed Supabase query builder and validated values                                                  |
| Sync races / duplicate tasks          | Unique upsert constraints; task IDs and ownership checks                                           |

Before production, implement an atomic database-backed rate-limit function, run Supabase advisors,
verify every policy with two real test users, rotate any exposed secret, and test deletion against a
dedicated Gmail account.
