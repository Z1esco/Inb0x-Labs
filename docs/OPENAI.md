# OpenAI email analysis

The analysis engine is an explicit, read-only operation over an owned, normalized Gmail thread. It
does not modify Gmail, generate replies, create tasks, run background agents, or fetch links. Demo
mode returns deterministic stored analyses without an API key or external request.

Extracted action items are suggestions only. The analysis engine never creates tasks; an authenticated
user must explicitly accept an item through the task API, which reloads the stored validated output.

## Configuration

Create an OpenAI API project and server-side key, configure billing and a low project budget, then
select a model available to that project. ChatGPT subscriptions and API billing are separate. Set:

- `OPENAI_API_KEY`: server-only API key.
- `OPENAI_MODEL`: required in real mode; deliberately not hardcoded.
- `OPENAI_REASONING_EFFORT`: model-supported effort, default `low`.
- `OPENAI_TIMEOUT_MS`: request timeout, default 30000.
- `OPENAI_MAX_RETRIES`: SDK transient retries, default 1 and maximum 1.
- `ANALYSIS_DAILY_LIMIT`: real model-call reservations per user per UTC day, default 20.
- `ANALYSIS_BATCH_LIMIT`: maximum unique thread IDs in one batch, default 10.

## Structured output and trust boundary

The official Node.js SDK calls the Responses API through `responses.parse` and a strict
Zod-backed Structured Outputs schema. Unknown properties, invalid dates, out-of-range confidence,
and oversized arrays or strings are rejected. Invalid output is never repaired with regex or stored.

The system instructions define email as untrusted evidence. Thread content is serialized as JSON
inside `<thread_data>` in the user input, and angle brackets in email content are escaped so a
message cannot close the boundary. The model is forbidden from following email instructions,
revealing prompts, executing commands, visiting links, or inventing facts. Post-validation verifies
source message IDs and evidence excerpts; unsupported claims are removed and confidence is reduced.

Requests use `store=false`, a one-way hashed user safety identifier, and bounded output. Logs must
never contain the API key, full prompt, normalized body, model response body, or provider error body.

## Cache, quota, and failures

The cache identity is the authenticated user, thread, content hash, prompt version, schema version,
and model. A cache hit does not reserve usage. `force=true` bypasses cache reads but still upserts the
same current cache identity. An atomic PostgreSQL function takes a per-user/day advisory lock before
reserving a real model call, preventing concurrent requests from exceeding the daily limit.

Transient provider failures use the SDK retry policy. Schema failures, invalid input, missing
configuration, authentication errors, and quota errors are not application-retried. Public errors
use stable safe codes such as `MODEL_OUTPUT_INVALID`, `ANALYSIS_LIMIT_REACHED`, `RATE_LIMITED`, and
`ANALYSIS_FAILED`; raw OpenAI errors are never returned.

Prompt and schema versions live in `src/prompts/versions.ts`. Increment the relevant version whenever
behavior or the public schema changes materially so stale cached output cannot be reused.

## Reply generation

Reply generation reuses the Responses API and strict Zod parsing but has a separate prompt and
schema version. Stored normalized thread content is authoritative; current owned analysis is optional.
The provider request uses `store=false`, no tools, and no background mode. Post-validation removes
ungrounded evidence and used facts before persistence. Tone, length, and normalized-instruction hash
participate in the cache identity, and `REPLY_DAILY_LIMIT` controls real calls. See `docs/REPLIES.md`.
