# Codebase structure

Inb0x uses a layered Next.js App Router structure. Extend the nearest existing feature directory;
do not create parallel architectures or move presentation files for backend work.

Root `PROJECT_RULES.md` is the permanent source of truth for product boundaries, ownership,
architecture, security, Git workflow, verification, and reporting requirements.

| Directory                                                                  | Responsibility                                                                | Owner                               |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------- |
| `src/app/api`                                                              | Thin HTTP authentication, validation, service calls, response mapping         | Backend lead                        |
| `src/server`                                                               | Server-only business logic, repositories, provider clients, security controls | Backend lead                        |
| `src/server/tasks`                                                         | Task service, repository, mapper, deduplication, and demo repository          | Backend lead                        |
| `src/server/replies`                                                       | Reply service, repository, mapper, grounding, and deterministic demo storage  | Backend lead                        |
| `src/server/dashboard`                                                     | Read-only aggregation, health, analytics, and bounded persistence reads       | Backend lead                        |
| `src/server/settings`                                                      | Settings/account service and user-scoped repository operations                | Backend lead                        |
| `src/schemas`                                                              | Strict Zod request and model-output schemas                                   | Backend lead                        |
| `src/types`                                                                | Shared public contracts and database type surface                             | Shared; backend coordinates changes |
| `src/lib`                                                                  | Shared API, validation, encryption, hashing, and Supabase utilities           | Backend lead                        |
| `src/mock`                                                                 | Deterministic fictional fixtures matching public contracts                    | Shared                              |
| `supabase/migrations`                                                      | Additive PostgreSQL schema, constraints, indexes, triggers, grants, and RLS   | Backend lead                        |
| `tests/unit`                                                               | Pure schemas, hashing, mapping, and security assertions                       | Backend lead                        |
| `tests/integration`                                                        | Authenticated routes, service boundaries, persistence behavior, demo flows    | Backend lead                        |
| `src/components`, dashboard/marketing presentation, `src/styles`, `public` | UI, responsive behavior, animation, assets, visual polish                     | Frontend partner                    |
| `DESIGN_RULES.md`, `docs/FRONTEND_ARCHITECTURE.md`                         | Frontend design authority, composition, responsive and motion rules           | Frontend partner                    |
| `docs`                                                                     | Architecture, API, security, setup, and handoff decisions                     | Shared                              |

## Layer rules

Routes authenticate the Supabase session, validate external input, call one service, and map errors.
Services enforce product behavior and ownership semantics. Repository modules contain user-scoped
Supabase queries. Mappers expose safe public projections. Schemas reject unknown or protected fields,
and shared contracts define what frontend code may rely on.

New backend features should normally add a focused directory under `src/server/<feature>`, reuse
existing utilities, add routes under `src/app/api/<feature>`, and update schemas, contracts, tests,
migrations, and documentation only as required. Frontend-owned files must not be moved or redesigned
without explicit coordination.
