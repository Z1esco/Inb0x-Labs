# API contract

Success: `{ "success": true, "data": {}, "meta": {} }`  
Error: `{ "success": false, "error": { "code": "INVALID_REQUEST", "message": "Safe message", "requestId": "uuid" } }`

All user routes require a verified Supabase session in real mode. Demo mode supplies one fixed
fictional user. No route accepts a client-supplied user ID.

| Method       | Route                          | Purpose                                                        |
| ------------ | ------------------------------ | -------------------------------------------------------------- |
| GET          | `/api/health`                  | Safe configuration health                                      |
| GET          | `/api/gmail/connect`           | Start read-only Gmail OAuth                                    |
| GET          | `/api/gmail/callback`          | Validate OAuth callback                                        |
| GET          | `/api/gmail/status`            | Connection status without tokens                               |
| POST         | `/api/gmail/disconnect`        | Revoke and remove tokens                                       |
| GET          | `/api/gmail/threads`           | List persisted threads; supports `limit`, `q`, and `pageToken` |
| GET          | `/api/gmail/threads/:threadId` | Thread detail                                                  |
| POST         | `/api/gmail/sync`              | Explicit bounded synchronization                               |
| POST         | `/api/analysis/thread`         | Analyze one thread                                             |
| POST         | `/api/analysis/inbox`          | Analyze a bounded thread batch                                 |
| POST         | `/api/replies/draft`           | Create manual-copy reply draft                                 |
| GET/POST     | `/api/tasks`                   | List or create tasks                                           |
| PATCH/DELETE | `/api/tasks/:taskId`           | Update or delete owned task                                    |
| GET/PATCH    | `/api/settings`                | Read or update settings                                        |
| POST         | `/api/settings/delete-data`    | Delete data after exact confirmation                           |
| POST         | `/api/demo/reset`              | Reset demo state                                               |

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
`MODEL_OUTPUT_INVALID`, `RATE_LIMITED`, `DEMO_MODE_ONLY`, and `INTERNAL_ERROR`.

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
