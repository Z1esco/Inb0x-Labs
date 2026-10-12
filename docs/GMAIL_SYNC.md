# Gmail thread synchronization

Gmail synchronization is an explicit, authenticated, read-only operation. It depends on the
separate Gmail OAuth connection and never runs automatically when the inbox is opened.

## Read-only boundary

The implementation calls only `users.threads.list` and `users.threads.get`. The service contains
an allowlist and tests that fail if Gmail send, modify, delete, draft, trash, untrash, or label
mutation calls are introduced. Attachment IDs are used only to recognize attachment metadata;
attachment data is never requested.

## Synchronization flow

1. `POST /api/gmail/sync` authenticates the Supabase user, validates the body, and applies a
   user-scoped rate limit.
2. The server obtains a valid OAuth client, refreshing the access token when necessary.
3. Gmail listing is restricted to recent inbox messages with
   `in:inbox newer_than:30d -in:spam -in:trash`. A validated user query may further narrow it.
4. At most 50 thread IDs are returned per request. Full threads are fetched with four workers,
   a 15-second request timeout, and one jittered retry for HTTP 429 or 5xx failures.
5. Each successful thread is normalized and persisted independently. A malformed or missing
   thread increments `failed` without discarding other successes. Authorization and permission
   failures stop safely with stable application errors.
6. Rows are inserted or conditionally updated by `user_id + gmail_thread_id`. Identical hashes
   update only the sync timestamp; optimistic hash and timestamp checks prevent stale overwrites.

## Normalization

- Gmail URL-safe Base64 is validated, padded, and decoded without executing content.
- Text parts are bounded before conversion. `text/plain` is preferred; HTML is converted to inert
  text in memory with scripts, styles, SVG, hidden elements, quoted blocks, images, and link
  destinations removed.
- Multipart content is walked recursively. Unknown charsets fall back to UTF-8.
- Message chronology and safe From, To, Cc, Reply-To, subject, date, labels, and MIME metadata are
  preserved. Missing or malformed headers receive deterministic fallbacks.
- Common quoted replies, forwarded sections, and signatures are trimmed conservatively. Exact
  duplicate bodies keep the newest copy. A single legitimate `>` line is not treated as history.
- Normalized thread text is capped by `THREAD_MAX_CHARACTERS` while prioritizing newest context.
- Attachment output includes only filename, MIME type, and approximate byte size. Provider
  attachment IDs and contents are neither stored nor returned.
- Suspicious instruction phrases set `containsPotentialPromptInjection`; the text remains inert
  email data and is never executed or followed.

## Hashing and storage

SHA-256 covers the thread ID, normalized subject, ordered message IDs and timestamps, and normalized
message text. Equivalent whitespace produces the same hash; content or order changes produce a new
hash. `email_threads` stores safe message JSON and bounded text, never raw HTML or attachments.

Retention cleanup clears normalized text and stored message bodies after the configured retention
window while retaining thread metadata. A later sync restores content even when the Gmail content
hash is unchanged.

## Public APIs

- `GET /api/gmail/threads` returns persisted list items. It supports `limit` (default 25, maximum
  50), `pageToken`, and subject search through `q`.
- `GET /api/gmail/threads/[threadId]` returns an owned persisted detail with ordered safe messages.
- `POST /api/gmail/sync` accepts `limit`, `query`, and an optional provider `pageToken`, returning
  requested, fetched, created, updated, unchanged, failed, pagination, and timestamp counts.

Category, priority, and reply filters return `INVALID_REQUEST` in real mode until analysis data is
joined. Public responses contain no raw Gmail payloads, OAuth tokens, attachment IDs, encrypted
fields, or internal Gmail thread IDs.

## Demo mode

Demo mode makes no Google or Supabase request. It exposes the same contracts with 12 deterministic
fictional threads, including long-content and prompt-injection fixtures, and returns a deterministic
sync summary.
