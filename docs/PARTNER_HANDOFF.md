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
