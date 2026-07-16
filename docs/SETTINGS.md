# Settings and account backend

The settings backend is split into thin authenticated route handlers, strict Zod request schemas, a
service for product behavior, and a repository containing explicitly user-scoped Supabase queries.
The public contracts live in `src/types/contracts.ts` and the typed browser wrapper lives in
`src/lib/api-client.ts`.

## Preferences

`GET /api/settings` returns profile metadata, appearance, dashboard preferences, AI defaults and
usage, and a safe Gmail status. `PATCH /api/settings` updates only allowlisted fields. Timezones must
be valid IANA names; locale, appearance, landing page, tone, and length are bounded enums or formats.
Avatar and locale are future-ready metadata only.

Reading or updating settings never invokes Google or OpenAI, performs a Gmail sync, analyzes email,
or generates a reply. Gmail status is read from persisted connection state.

## Account controls

`GET /api/account` produces a bounded JSON export for the authenticated user. Export projections
include user-owned normalized content and generated records, but exclude OAuth states, provider
tokens, encrypted credentials, service-role material, and API keys.

`DELETE /api/account` accepts only the exact confirmation phrase `DELETE MY ACCOUNT`. In production,
the server-only Supabase Auth Admin operation deletes exactly the authenticated user; database foreign
keys cascade owned rows. In demo mode, the route resets the fixed fictional dataset instead.

Gmail disconnect remains an explicit idempotent operation. Remote token revocation is best effort,
but local encrypted credentials are always cleared. Demo reset is authenticated, demo-only, bounded,
and deterministic.

## Production verification

Apply `supabase/migrations/20260716185440_settings_preferences.sql`, regenerate database types, and
test export and deletion with a disposable two-user Supabase project. Confirm that each user sees
only their own data, token fields never appear in exports, and deleting one account cannot affect the
other. Rotate any credential that has previously been disclosed before linking or deploying.
