# Database

The initial migration is in `supabase/migrations`. `profiles` mirrors Supabase Auth identity;
`gmail_connections` holds encrypted provider tokens; `email_threads` holds bounded Gmail data;
`email_analyses` holds derived structured output; `tasks` and `reply_drafts` reference source
threads; `user_settings` holds limits and retention; `usage_events` supports quotas and safe
auditing; `oauth_states` and `rate_limits` support security controls.

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
