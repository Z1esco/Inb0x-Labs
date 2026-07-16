# Team ownership

The technical lead owns foundation, authentication, Gmail OAuth/API, Supabase schema and RLS,
backend services, OpenAI, routes, security, contracts, demo data, tests, deployment, and docs.

The frontend partner owns final landing/login/dashboard/inbox/thread/task/draft/insights/settings
screens, charts, animation, responsive styling, Figma implementation, and visual polish. Their
primary paths are `src/components`, `src/app/(marketing)`, `src/app/(dashboard)`, `src/styles`,
and `public`.

After this shell, backend changes should avoid partner paths. Coordinate contract changes in
`src/types/contracts.ts` before merging. The Figma URL is a reference only; no automation edits it.
