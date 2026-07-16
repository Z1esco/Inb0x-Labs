# API contract

Success: `{ "success": true, "data": {}, "meta": {} }`  
Error: `{ "success": false, "error": { "code": "INVALID_REQUEST", "message": "Safe message", "requestId": "uuid" } }`

All user routes require a verified Supabase session in real mode. Demo mode supplies one fixed
fictional user. No route accepts a client-supplied user ID.

| Method           | Route                          | Purpose                                                        |
| ---------------- | ------------------------------ | -------------------------------------------------------------- |
| GET              | `/api/health`                  | Safe configuration health                                      |
| GET              | `/api/dashboard`               | Read-only persisted dashboard aggregation                      |
| GET              | `/api/gmail/connect`           | Start read-only Gmail OAuth                                    |
| GET              | `/api/gmail/callback`          | Validate OAuth callback                                        |
| GET              | `/api/gmail/status`            | Connection status without tokens                               |
| POST             | `/api/gmail/disconnect`        | Revoke and remove tokens                                       |
| GET              | `/api/gmail/threads`           | List persisted threads; supports `limit`, `q`, and `pageToken` |
| GET              | `/api/gmail/threads/:threadId` | Thread detail                                                  |
| POST             | `/api/gmail/sync`              | Explicit bounded synchronization                               |
| POST             | `/api/analysis/thread`         | Analyze one thread                                             |
| POST             | `/api/analysis/inbox`          | Analyze a bounded thread batch                                 |
| GET              | `/api/analysis/:threadId`      | Return the current owned cached analysis                       |
| POST             | `/api/replies/draft`           | Generate or reuse a grounded copy-only reply draft             |
| GET              | `/api/replies`                 | List owned reply drafts                                        |
| GET/DELETE       | `/api/replies/:draftId`        | Read or delete an owned reply draft                            |
| GET/POST         | `/api/tasks`                   | Filter/list or manually create tasks                           |
| POST             | `/api/tasks/from-analysis`     | Explicitly accept one stored analysis action                   |
| GET/PATCH/DELETE | `/api/tasks/:taskId`           | Read, update, complete, reopen, or delete an owned task        |
| GET/PATCH        | `/api/settings`                | Read or update settings                                        |
| GET/DELETE       | `/api/account`                 | Export owned data or delete the authenticated account          |
| POST             | `/api/settings/delete-data`    | Delete data after exact confirmation                           |
| POST             | `/api/demo/reset`              | Reset demo state                                               |

```bash
curl -X POST http://localhost:3000/api/analysis/thread \
  -H "content-type: application/json" \
  -d '{"threadId":"proposal-approval","force":false}'
```

```bash
curl -X POST http://localhost:3000/api/replies/draft \
  -H "content-type: application/json" \
  -d '{"threadId":"proposal-approval","tone":"professional","length":"short"}'
```

Stable errors include `UNAUTHENTICATED`, `FORBIDDEN`, `INVALID_REQUEST`,
`OAUTH_STATE_INVALID`, `OAUTH_STATE_EXPIRED`, `OAUTH_ACCESS_DENIED`,
`GOOGLE_CONFIGURATION_ERROR`,
`GMAIL_NOT_CONNECTED`, `GMAIL_AUTH_EXPIRED`, `GMAIL_PERMISSION_DENIED`,
`GMAIL_RATE_LIMITED`, `GMAIL_SYNC_FAILED`,
`THREAD_NOT_FOUND`, `ANALYSIS_LIMIT_REACHED`, `ANALYSIS_FAILED`,
`MODEL_OUTPUT_INVALID`, `THREAD_CONTENT_UNAVAILABLE`, `REPLY_DRAFT_NOT_FOUND`,
`REPLY_LIMIT_REACHED`, `OPENAI_NOT_CONFIGURED`, `REPLY_GENERATION_FAILED`, `MODEL_TIMEOUT`,
`GROUNDING_FAILED`, `RATE_LIMITED`, `DEMO_MODE_ONLY`, and `INTERNAL_ERROR`.

`GET /api/gmail/status` returns only `connected`, `gmailAddress`, `grantedScopes`,
`connectedAt`, `lastSyncedAt`, `requiresReauthorization`, and `readOnly`. Provider tokens,
encrypted payloads, Google secrets, and internal connection IDs are never public fields.

The browser callback redirects only to fixed destinations: `/dashboard?gmail=connected`,
`/settings?gmail=denied`, or `/settings?gmail=error`.

## Gmail thread APIs

`GET /api/gmail/threads` reads persisted data and accepts `limit` (1-50, default 25), `pageToken`,
and `q`. It does not trigger Gmail synchronization. Real-mode `category`, `priority`, and
`needsReply` filters return `INVALID_REQUEST` until analysis joins support them.

`GET /api/gmail/threads/:threadId` checks the authenticated owner and returns ordered normalized
messages plus safe attachment metadata. It never returns raw HTML, Gmail attachment IDs, OAuth
credentials, or internal Gmail thread IDs.

`POST /api/gmail/sync` accepts `{ "limit": 25, "query": "optional", "pageToken": "optional" }`.
It returns `requested`, `fetched`, `created`, `updated`, `unchanged`, `failed`, `nextPageToken`, and
`syncedAt`. Each failed thread is isolated unless the OAuth grant or Gmail permission is invalid.

## Analysis APIs

`POST /api/analysis/thread` accepts `{ "threadId": "owned-thread-id", "force": false }`. It checks
the current authenticated owner, normalized content, cache identity, daily quota, and per-user rate
limit. The structured analysis is returned in `data`; `meta` contains `cached` and
`usage: { used, limit, remaining }`. Cache hits do not consume quota.

`POST /api/analysis/inbox` accepts `{ "threadIds": ["id"], "force": false }`. IDs are validated and
deduplicated, the server maximum defaults to 10, and work runs with concurrency two. The response
contains requested, analyzed, cached, failed, skipped, limitReached, usage, and ordered per-thread
statuses. One malformed thread does not fail the batch.

`GET /api/analysis/:threadId` returns only the current cached analysis matching the thread's content,
prompt version, schema version, and configured model. Missing and unauthorized records both return
`THREAD_NOT_FOUND`. No route accepts a user ID or exposes prompts, raw model output, tokens, provider
response bodies, usage event IDs, or database implementation fields. The safe analysis UUID in
response metadata is the explicit task-source reference.

## Task APIs

`GET /api/tasks` accepts `status`, `priority`, `source`, `dueBefore`, `dueAfter`, `threadId`, `limit`,
`cursor`, and `sort`. Sort values are `due_asc`, `due_desc`, `created_desc`, `created_asc`, and
`priority_desc`. Data is `{ "tasks": [] }`; metadata includes the opaque next cursor, limit, and total.

`POST /api/tasks` accepts only `{ "title", "description", "priority", "dueAt" }`. Priority defaults
to `medium`; source and completion fields are server-controlled.

`POST /api/tasks/from-analysis` accepts
`{ "analysisId": "UUID", "actionIndex": 0 }`. The server reads the stored owned action item and
returns `{ "task", "created", "duplicate" }`. It rejects client-supplied action text or evidence.

`GET`, `PATCH`, and `DELETE /api/tasks/:taskId` hide missing and unauthorized tasks behind
`TASK_NOT_FOUND`. PATCH accepts only title, description, priority, due date, and status. DELETE is
idempotent and never deletes the source email or analysis.

## Reply draft APIs

`POST /api/replies/draft` accepts `{ "threadId", "tone", "length", "instructions?", "force?" }`.
The stored owned thread is the only email source. The response contains a plain-text draft with
grounded evidence, warnings, `copyOnly: true`, and `sent: false`; metadata contains cache and daily
usage state. It never accepts a user ID, recipients, raw email, analysis output, tokens, or evidence.

`GET /api/replies` accepts `threadId`, `tone`, `length`, `limit`, `cursor`, and `sort`. Sort values
are `created_desc`, `created_asc`, and `updated_desc`; the maximum page size is 100.
`GET /api/replies/:draftId` and `DELETE /api/replies/:draftId` use authenticated ownership and hide
missing or cross-user IDs behind `REPLY_DRAFT_NOT_FOUND`. Deletion never removes source data.

## Dashboard API

`GET /api/dashboard?timezone=Asia%2FKuala_Lumpur` returns user-owned persisted overview, focus,
priority metadata, tasks, copy-only drafts, usage, seven-day trends, and safe activity. The timezone
must be a valid IANA name. It never calls Gmail/OpenAI or performs mutations. See `docs/DASHBOARD.md`.

The frontend consumes this response through `src/lib/api-client.ts`. Dashboard, Inbox, Insights, Tasks,
and Drafts render loading, empty, and safe error states; none of them starts Gmail sync, analysis, or
reply generation automatically. Settings and account controls consume the merged settings contract.

## Settings and account APIs

`GET /api/settings` returns profile metadata, appearance, dashboard preferences, AI defaults and
usage, the demo indicator, and safe Gmail connection status. `PATCH /api/settings` accepts only
`displayName`, `timezone`, `locale`, `appearance`, `defaultLandingPage`, `compactMode`,
`showAnalytics`, `showInboxHealth`, `showRecentActivity`, `defaultReplyTone`, and
`defaultReplyLength`. Unknown ownership or credential fields are rejected. These routes never sync
Gmail, invoke OpenAI, or trigger analysis.

`GET /api/account` returns a bounded JSON export of the authenticated user's owned application data.
Its Gmail projection excludes access tokens, refresh tokens, encrypted payloads, OAuth state, and
provider secrets. `DELETE /api/account` requires
`{ "confirmation": "DELETE MY ACCOUNT" }`; real mode deletes the current Supabase Auth user and
relies on existing foreign-key cascades, while demo mode resets the fixed fictional state.

`POST /api/gmail/disconnect` remains idempotent: remote revocation is attempted, local encrypted
credentials are removed even if revocation fails, and no provider error body is exposed.
`POST /api/demo/reset` is authenticated, demo-only, rate-limited, and restores deterministic data.
