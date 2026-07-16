# Inb0x implementation plan

## Current repository state

- Initialized locally on the `setup/foundation` branch.
- Existing root `README.md` and `SECURITY.md` are preserved.
- No application source, package manifest, environment file, or prior architecture exists.
- Local toolchain: Node.js 22.15.1, npm 10.9.2, Git 2.51.0.

## Architecture

Inb0x will use a layered Next.js App Router architecture. Route handlers authenticate,
validate, delegate to services, and map errors. Business logic lives in `src/server`;
portable validation and API contracts live in `src/schemas`, `src/types`, and `src/lib`.
Supabase provides application identity and PostgreSQL persistence. Google OAuth is a
separate explicit authorization flow with Gmail read-only scopes. OpenAI analysis uses
the Responses API with strict structured output. Demo mode uses deterministic in-memory
fixtures behind the same contracts and requires no external credentials.

## Implementation phases

1. Scaffold strict TypeScript, Next.js, Tailwind, lint, format, test, and CI configuration.
2. Add typed environment validation, Supabase clients, SQL migrations, RLS, and seed data.
3. Add session authorization, OAuth state protection, token encryption, Gmail integration,
   normalization, refresh, disconnect, and retention services.
4. Add strict AI schemas, prompts, Responses API integration, caching, usage limits, and drafts.
5. Add stable API contracts, route handlers, structured logging, and safe error mapping.
6. Add deterministic demo repositories, minimal UI shell, typed API client, and handoff types.
7. Add unit, integration, and browser coverage; finish documentation; run the full quality gate.

## Main risks

- External flows cannot be exercised without Supabase, Google, and OpenAI credentials.
- Gmail content is hostile input; HTML, prompt injection, oversized bodies, and malformed data
  require bounded parsing and strict trust boundaries.
- OAuth tokens and service-role credentials create high-impact leakage risk.
- A two-person team can create merge conflicts in UI-owned directories without clear ownership.
- Free-tier and model costs require explicit analysis triggers, caching, quotas, and bounded retries.

## External setup requirements

- Supabase project with migrations applied, Google application sign-in configured, and RLS verified.
- Google Cloud project with Gmail API enabled and exact local/production OAuth redirect URIs.
- OpenAI API project with billing or credits, a server-side API key, and an explicitly configured model.
- Vercel project and production environment variables; no deployment will be performed automatically.

## Test strategy

- Unit tests cover environment parsing, encryption, hashing, Gmail parsing, schemas, prompts,
  cache keys, limits, and safe error mapping.
- Integration tests exercise demo repositories and authenticated service boundaries without external APIs.
- Playwright covers critical demo-mode navigation and user flows.
- CI and `npm run check` run formatting, lint, type checking, tests, and a production build.

## Security decisions

- Application authentication and Gmail authorization remain separate.
- Gmail scopes are allowlisted and read-only; no mutation or send code will exist.
- Provider tokens use versioned AES-256-GCM encryption and remain server-side.
- Every public user-owned table has RLS policies with ownership predicates.
- Email is sanitized, bounded, and treated as data rather than instructions.
- Logs use an allowlist and exclude secrets, raw content, prompts, and drafts.

## Cost-control decisions

- Demo mode is deterministic and credential-free.
- Analysis only runs on explicit requests, is cached by content hash and prompt version, and is
  constrained by daily, batch, input-size, timeout, and retry limits.
- The MVP uses no embeddings, vector database, Redis, scheduler, background agent, or paid monitoring.

## Partner handoff plan

- The frontend partner owns `src/components`, marketing/dashboard route-group presentation,
  `src/styles`, and `public` after the minimal shell is created.
- Stable public types live in `src/types/contracts.ts`; matching fixtures live in `src/mock`.
- `src/lib/api-client.ts` provides the typed boundary from mock-backed UI to real routes.
- Backend work remains concentrated in API, server, schema, prompt, database, test, and docs paths.
