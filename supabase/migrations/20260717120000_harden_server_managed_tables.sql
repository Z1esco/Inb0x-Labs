begin;

-- These tables are readable through ownership-scoped RLS where the product
-- needs it, but mutations must pass through validated server routes.
revoke insert, update, delete on public.profiles from authenticated;
revoke insert, update, delete on public.email_threads from authenticated;
revoke insert, update, delete on public.email_analyses from authenticated;
revoke insert, update, delete on public.user_settings from authenticated;
revoke insert, update, delete on public.usage_events from authenticated;
revoke insert, update, delete on public.rate_limits from authenticated;

-- Credential-bearing and OAuth-state tables remain completely unavailable to
-- browser Data API roles. Server services use the service role and always
-- scope user-owned operations by the authenticated user ID.
revoke all on public.gmail_connections, public.oauth_states
from authenticated, anon;

revoke all on public.profiles, public.email_threads, public.email_analyses,
  public.user_settings, public.usage_events, public.rate_limits
from anon;

commit;
