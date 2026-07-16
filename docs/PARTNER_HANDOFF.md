# Frontend partner handoff

```bash
git clone https://github.com/Z1esco/Inb0x-Labs.git
cd Inb0x-Labs
npm install
copy .env.example .env.local
npm run dev
```

Keep `DEMO_MODE=true`. Public types are in `src/types/contracts.ts`, fixtures are in `src/mock`, and
the typed fetch wrapper is `src/lib/api-client.ts`. Replace server fixture reads with API-client calls
while preserving loading, empty, and error states.

Own `src/components`, marketing/dashboard presentation routes, `src/styles`, and `public`. Coordinate
before changing `src/app/api`, `src/server`, `src/schemas`, `src/prompts`, `supabase`, or public contracts.

Read `DESIGN_RULES.md`, `docs/FRONTEND_ARCHITECTURE.md`, `docs/DESIGN_SYSTEM.md`,
`docs/MOTION_SYSTEM.md`, and `docs/ACCESSIBILITY.md` before changing the frontend foundation. The
`feat/frontend-cinematic-ui` branch provides the current shell and domain views; preserve the no-green,
no-textual-pill, read-only, copy-only, and explicit-task boundaries. The frontend branch is now
integrated into `develop`; create subsequent branches from the latest reviewed `develop`.

Create `feat/short-name` from `develop`, use conventional commits, keep PRs focused, and run
`npm run check` before review. Avoid moving shared types or rewriting the minimal shell and backend in
the same PR; this keeps merge conflicts small.

Task contracts now expose `TaskListResponse`, `TaskPagination`, `CreateTaskRequest`,
`CreateTaskFromAnalysisRequest`, `UpdateTaskRequest`, and safe source-email metadata. Use
`POST /api/tasks/from-analysis` with the `analysisId` returned in analysis response metadata and the
selected action index. Never send action text or evidence from the browser. Task list data is
`{ tasks: Task[] }` with pagination in response metadata; `src/lib/api-client.ts` preserves the
existing `listTasks(): Promise<Task[]>` convenience for the current task board.
Use `analyzeThreadWithMetadata()` to retain the analysis ID, then
`createTaskFromAnalysis()` after the user explicitly selects an action.

Reply contracts expose `ReplyDraft`, `ReplyEvidence`, request/filter/pagination types, and usage
metadata. Use `createDraft()`, `listDrafts()`, `getDraft()`, and `deleteDraft()`. The UI's primary
action is **Copy reply**. Render plain text only, show warnings and uncertain points, and never add a
Send button or imply delivery. Every returned draft has `copyOnly: true` and `sent: false`.

Use `apiClient.getDashboard({ timezone, signal })` for bounded overview, focus, priority, task,
copy-only draft, usage, analytics, and activity data. Do not trigger sync, analysis, or reply
generation during render. Present health as transparent workload triage, not a user judgment.

Settings contracts are `SettingsData` and `UpdateSettingsRequest`. Use `apiClient.getSettings()` and
`apiClient.updateSettings(input)`; do not send a user ID, credential, usage counter, or Gmail state.
The appearance and dashboard fields are preferences only—the current backend does not alter visual
components. Use `apiClient.getAccount()` for a user-initiated JSON export and
`apiClient.deleteAccount("DELETE MY ACCOUNT")` only behind a destructive confirmation flow. Gmail
disconnect and demo reset remain explicit buttons; loading the settings screen must never trigger
sync, analysis, draft generation, or provider calls.

`AppNav` receives the server-verified demo flag and authenticated email from the protected layout.
Do not reintroduce hard-coded demo identity in real mode. The sign-out control posts to
`/api/auth/logout`; mobile users can reach it through the labeled navigation drawer.
