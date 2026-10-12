begin;

-- Supabase may provision broad default table privileges for Data API roles.
-- Establish the browser boundary explicitly: authenticated clients may read
-- only user-scoped product data through RLS, while all mutations remain behind
-- validated server routes. Credential and OAuth-state tables stay server-only.
revoke all on table
  public.profiles,
  public.gmail_connections,
  public.oauth_states,
  public.email_threads,
  public.email_analyses,
  public.tasks,
  public.reply_drafts,
  public.user_settings,
  public.usage_events,
  public.rate_limits
from anon, authenticated;

grant select on table
  public.profiles,
  public.email_threads,
  public.email_analyses,
  public.tasks,
  public.reply_drafts,
  public.user_settings,
  public.usage_events,
  public.rate_limits
to authenticated;

commit;
