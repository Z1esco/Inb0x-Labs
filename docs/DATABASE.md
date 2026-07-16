# Database

The initial migration is in `supabase/migrations`. `profiles` mirrors Supabase Auth identity;
`gmail_connections` holds encrypted provider tokens; `email_threads` holds bounded Gmail data;
`email_analyses` holds derived structured output; `tasks` and `reply_drafts` reference source
threads; `user_settings` holds limits and retention; `usage_events` supports quotas and safe
auditing; `oauth_states` and `rate_limits` support security controls.

`email_threads.messages` is a JSON array containing only normalized message text and safe metadata.
It never contains raw HTML, attachment bodies, or provider attachment IDs. The row also records the
normalized character count, whether content was trimmed, and a non-authoritative prompt-injection
marker. A unique constraint on `user_id + gmail_thread_id` prevents duplicate synchronization.

`user_settings` also stores validated timezone, locale, appearance, default landing page, compact
mode, and dashboard visibility preferences. Defaults are deterministic and database checks constrain
all enum-like fields. Profile display name and future avatar URL remain in `profiles`; account
deletion removes the Supabase Auth user and existing foreign keys cascade owned application rows.

`email_analyses` stores only schema-validated structured output and provider audit metadata. Its
cache uniqueness covers thread, content hash, prompt version, schema version, and model. The
`reserve_analysis_usage` service-role-only function uses a transaction advisory lock to atomically
count and reserve one real model call per authenticated user and UTC day. Browser roles cannot call
that function. Cache hits and demo responses do not create usage events.

`tasks` supports manual and explicitly accepted email actions. Email-derived rows preserve the
owning thread, analysis, source message, and a maximum-300-character evidence excerpt. A unique
`user_id + source_action_key` constraint prevents concurrent duplicates while allowing unlimited
manual tasks because their key is null. Checks bound titles/descriptions/evidence, validate source
shapes, and require `completed_at` exactly when status is completed. A trigger rejects cross-user
thread or analysis links independently of repository queries. Authenticated browser roles receive
read-only table access through RLS; mutations use the server-only service role because protected source
fields must never be writable through the Data API. Every privileged mutation still filters or assigns
the authenticated user explicitly. User/status, due-date, source, and priority indexes support filters.

`reply_drafts` stores schema-validated plain-text drafts, short grounded evidence, content and
instruction hashes, prompt/schema/model identity, and token counts. Its unique cache constraint
covers user, thread, content, prompt, schema, model, tone, length, and instructions hash. A trigger
rejects cross-user thread or analysis links. Authenticated clients may select only their own rows
through RLS; insert/update/delete grants are revoked and server mutations remain explicitly user
scoped. `reserve_reply_usage` atomically limits real model calls per user and UTC day and is executable
only by `service_role`.

The dashboard adds no database object. It reads bounded safe projections from existing RLS-protected
tables, scopes every privileged query by authenticated `user_id`, excludes bodies, and treats only
analyses whose content hash matches the current thread as current.

All user-owned tables enable Row Level Security. SELECT, INSERT, UPDATE, and DELETE policies
combine `TO authenticated` with `(select auth.uid()) = user_id` (or profile `id`). UPDATE uses
both `USING` and `WITH CHECK`. Explicit Data API grants are present because table exposure and
RLS are separate controls. `anon` receives no table privileges.

Apply migrations:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npx supabase db advisors
```

Generate exact project types after linking with `npm run db:types`. The checked-in
`src/types/database.ts` is a small development surface, not a substitute for regenerated types.
