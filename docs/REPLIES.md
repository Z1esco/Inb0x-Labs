# Grounded reply drafts

Inb0x generates reviewable plain-text drafts only. It has no Gmail send route, Gmail draft-creation
client, automatic reply behavior, or send status. The primary product action is **Copy reply**.

## Flow and controls

`POST /api/replies/draft` authenticates the Supabase user, validates `threadId`, `tone`, `length`,
optional instructions, and `force`, then loads only the user's stored normalized thread. The service
uses the latest owned analysis only when it matches the current thread content hash. The thread
remains authoritative and analysis is optional.

Tones are `direct`, `balanced`, `warm`, and `professional`. Lengths are `short`, `medium`, and
`detailed`. Instructions are limited to 1,000 characters, represent user intent rather than evidence,
and cannot authorize sending, secret disclosure, or unsupported claims.

## OpenAI and grounding

Real mode uses the official Node.js SDK, Responses API, `responses.parse`, and a strict Zod
Structured Outputs schema. The prompt version is `draft-reply-v2`; the reply schema version is `1`.
Requests use `store=false`, bounded input/output, a hashed safety identifier, the configured model,
30-second default timeout, and at most one SDK retry.

Email JSON is inside `<thread_data>` and user instructions are separately inside
`<user_reply_instructions>`. Angle brackets in untrusted values are escaped. The system instruction
forbids following email commands, browsing links, sending, external actions, invented facts,
availability, deadlines, attachments, meetings, prices, payments, commitments, and signatures.

Post-validation checks evidence source IDs and excerpts against stored messages. Unsupported
evidence and used facts are removed, confidence is capped, and a warning is added. Existing subjects
are normalized to exactly one `Re:` prefix. The output exposes `copyOnly: true` and `sent: false`.

## Cache, quota, and persistence

Cache identity includes user, thread, thread content hash, prompt/schema versions, configured model,
tone, length, and a SHA-256 hash of normalized instructions. Cache hits do not consume usage.
`force=true` bypasses the cache read and safely replaces the same identity. The default real-model
limit is `REPLY_DAILY_LIMIT=20`; an atomic PostgreSQL reservation prevents concurrent overuse.

`reply_drafts` stores only validated draft fields, short evidence, hashes, provider audit IDs, and
token counts. It does not store the raw prompt, hidden instructions, provider tokens, or raw email.
RLS restricts reads to the owner. Mutations use server routes with explicit user scoping, and a
database trigger validates thread and analysis ownership.

## Routes and demo mode

- `POST /api/replies/draft` generates or returns a cached draft.
- `GET /api/replies` lists owned drafts with bounded filters and cursor pagination.
- `GET /api/replies/:draftId` returns one owned draft.
- `DELETE /api/replies/:draftId` idempotently deletes only the draft.

Demo mode requires no Gmail, Supabase, or OpenAI credentials. It supports every tone and length,
bounded optional instructions, deterministic cache-like IDs, listing, detail, deletion, reset,
warnings, evidence, and the fictional prompt-injection thread.

## Known limitations

Draft grounding is conservative but cannot prove every natural-language implication. Users must
review all text before copying it. The MVP has no send, Gmail draft, rich HTML, attachment processing,
signature, translation, calendar, background generation, or scheduled action.
