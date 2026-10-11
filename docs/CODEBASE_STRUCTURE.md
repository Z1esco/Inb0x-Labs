# Codebase structure

Inb0x uses a layered Next.js App Router structure. Extend the nearest existing feature directory;
do not create parallel architectures or move presentation files for backend work.

Root `PROJECT_RULES.md` is the permanent source of truth for product boundaries, ownership,
architecture, security, Git workflow, verification, and reporting requirements.

| Directory                                                                  | Responsibility                                                                | Owner                  |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------- |
| `src/app/api`                                                              | Thin HTTP authentication, validation, service calls, response mapping         | Server review          |
| `src/server`                                                               | Server-only business logic, repositories, provider clients, security controls | Server review          |
| `src/server/tasks`                                                         | Task service, repository, mapper, deduplication, and demo repository          | Server review          |
| `src/server/replies`                                                       | Reply service, repository, mapper, grounding, and deterministic demo storage  | Server review          |
| `src/server/dashboard`                                                     | Read-only aggregation, health, analytics, and bounded persistence reads       | Server review          |
| `src/server/settings`                                                      | Settings/account service and user-scoped repository operations                | Server review          |
| `src/schemas`                                                              | Strict Zod request and model-output schemas                                   | Server review          |
| `src/types`                                                                | Shared public contracts and database type surface                             | Shared contract review |
| `src/lib`                                                                  | Shared API, validation, encryption, hashing, and Supabase utilities           | Server review          |
| `src/proxy.ts`                                                             | Supabase SSR session-cookie refresh before protected server rendering         | Server review          |
| `src/mock`                                                                 | Deterministic fictional fixtures matching public contracts                    | Shared                 |
| `supabase/migrations`                                                      | Additive PostgreSQL schema, constraints, indexes, triggers, grants, and RLS   | Server review          |
| `tests/unit`                                                               | Pure schemas, hashing, mapping, and security assertions                       | Server review          |
| `tests/integration`                                                        | Authenticated routes, service boundaries, persistence behavior, demo flows    | Server review          |
| `src/components`, dashboard/marketing presentation, `src/styles`, `public` | UI, responsive behavior, animation, assets, visual polish                     | UI review              |
| `DESIGN_RULES.md`, `docs/FRONTEND_ARCHITECTURE.md`                         | Frontend design authority, composition, responsive and motion rules           | UI review              |
| `docs`                                                                     | Architecture, API, security, setup, and handoff decisions                     | Shared                 |

The solo founder owns every directory. Labels above describe review boundaries for coding agents, not separate staff or approval owners.

## Layer rules

Routes authenticate the Supabase session, validate external input, call one service, and map errors.
Services enforce product behavior and ownership semantics. Repository modules contain user-scoped
Supabase queries. Mappers expose safe public projections. Schemas reject unknown or protected fields,
and shared contracts define what frontend code may rely on.

New backend features should normally add a focused directory under `src/server/<feature>`, reuse
existing utilities, add routes under `src/app/api/<feature>`, and update schemas, contracts, tests,
migrations, and documentation only as required. Frontend-owned files must not be moved or redesigned
without explicit coordination.
