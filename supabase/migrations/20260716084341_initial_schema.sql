begin;

create extension if not exists pgcrypto;
create schema if not exists private;

create function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = timezone('utc', now()); return new; end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null, display_name text, avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create table public.gmail_connections (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  google_subject text not null, gmail_address text not null, encrypted_access_token text not null,
  encrypted_refresh_token text not null, token_expiry timestamptz, granted_scopes text[] not null default '{}',
  connected_at timestamptz not null default timezone('utc', now()), last_synced_at timestamptz, revoked_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  constraint gmail_connections_user_unique unique(user_id), constraint gmail_connections_subject_unique unique(user_id, google_subject)
);
create table public.email_threads (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  gmail_thread_id text not null, gmail_history_id text, subject text not null default '(No subject)',
  participants text[] not null default '{}', sender_names text[] not null default '{}', message_count integer not null default 0 check (message_count >= 0),
  latest_message_at timestamptz not null, snippet text not null default '', normalized_text text, content_hash text not null,
  normalized_character_count integer not null default 0 check (normalized_character_count >= 0),
  content_trimmed boolean not null default false, contains_potential_prompt_injection boolean not null default false,
  messages jsonb not null default '[]'::jsonb check (jsonb_typeof(messages) = 'array'),
  has_attachments boolean not null default false, gmail_labels text[] not null default '{}', synced_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  constraint email_threads_user_gmail_unique unique(user_id, gmail_thread_id)
);
create table public.email_analyses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  email_thread_id uuid not null references public.email_threads(id) on delete cascade, content_hash text not null,
  prompt_version text not null, schema_version text not null, model text not null, response_id text,
  summary text not null, category text not null check (category in ('urgent','work','finance','meeting','personal','newsletter','promotion','notification','security','other')),
  priority_score integer not null check (priority_score between 0 and 100), priority_level text not null check (priority_level in ('critical','high','medium','low')),
  priority_reason text not null, needs_reply boolean not null, reply_reason text, confidence double precision not null check (confidence between 0 and 1),
  deadlines jsonb not null default '[]', action_items jsonb not null default '[]', meetings jsonb not null default '[]', evidence jsonb not null default '[]', safety_flags jsonb not null default '[]',
  input_tokens integer check (input_tokens is null or input_tokens >= 0), output_tokens integer check (output_tokens is null or output_tokens >= 0),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  constraint email_analyses_cache_unique unique(email_thread_id, content_hash, prompt_version, schema_version, model)
);
create table public.tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  email_thread_id uuid references public.email_threads(id) on delete set null, email_analysis_id uuid references public.email_analyses(id) on delete set null,
  title text not null check (char_length(title) between 1 and 300), description text,
  source text not null check (source in ('email','manual')), status text not null default 'open' check (status in ('open','in_progress','completed')),
  priority text not null check (priority in ('critical','high','medium','low')), due_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.reply_drafts (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  email_thread_id uuid not null references public.email_threads(id) on delete cascade, email_analysis_id uuid references public.email_analyses(id) on delete set null,
  tone text not null check (tone in ('direct','balanced','warm','professional')), length text not null check (length in ('short','medium','detailed')),
  instructions text, subject text not null, body text not null, model text not null, prompt_version text not null, response_id text, confidence double precision check (confidence between 0 and 1),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade, demo_mode boolean not null default false,
  daily_analysis_limit integer not null default 20 check (daily_analysis_limit between 1 and 100),
  gmail_lookback_days integer not null default 30 check (gmail_lookback_days between 1 and 365),
  gmail_max_threads integer not null default 50 check (gmail_max_threads between 1 and 100),
  data_retention_hours integer not null default 24 check (data_retention_hours between 1 and 720),
  preferred_tone text not null default 'balanced' check (preferred_tone in ('direct','balanced','warm','professional')),
  preferred_reply_length text not null default 'medium' check (preferred_reply_length in ('short','medium','detailed')),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now())
);
create table public.usage_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null, model text, input_tokens integer check (input_tokens is null or input_tokens >= 0), output_tokens integer check (output_tokens is null or output_tokens >= 0),
  metadata jsonb not null default '{}', created_at timestamptz not null default timezone('utc', now())
);
create table public.oauth_states (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  state_hash text not null unique, expires_at timestamptz not null, consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create table public.rate_limits (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  action text not null, window_started_at timestamptz not null, request_count integer not null default 1 check (request_count > 0),
  created_at timestamptz not null default timezone('utc', now()), updated_at timestamptz not null default timezone('utc', now()),
  constraint rate_limits_window_unique unique(user_id, action, window_started_at)
);

create index email_threads_user_latest_idx on public.email_threads(user_id, latest_message_at desc);
create index email_analyses_user_created_idx on public.email_analyses(user_id, created_at desc);
create index tasks_user_status_due_idx on public.tasks(user_id, status, due_at);
create index usage_events_user_type_created_idx on public.usage_events(user_id, event_type, created_at desc);
create index oauth_states_expiry_idx on public.oauth_states(expires_at) where consumed_at is null;
create index rate_limits_user_action_idx on public.rate_limits(user_id, action, window_started_at desc);

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','gmail_connections','email_threads','email_analyses','tasks','reply_drafts','user_settings','usage_events','oauth_states','rate_limits']
  loop execute format('alter table public.%I enable row level security', table_name); end loop;
end $$;

create policy profiles_select on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_insert on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy profiles_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy profiles_delete on public.profiles for delete to authenticated using ((select auth.uid()) = id);

do $$ declare table_name text; begin
  foreach table_name in array array['gmail_connections','email_threads','email_analyses','tasks','reply_drafts','user_settings','usage_events','oauth_states','rate_limits']
  loop
    execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name || '_select', table_name);
    execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name || '_insert', table_name);
    execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name || '_update', table_name);
    execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', table_name || '_delete', table_name);
  end loop;
end $$;

do $$ declare table_name text; begin
  foreach table_name in array array['profiles','gmail_connections','email_threads','email_analyses','tasks','reply_drafts','user_settings','rate_limits']
  loop execute format('create trigger %I before update on public.%I for each row execute function private.set_updated_at()', table_name || '_set_updated_at', table_name); end loop;
end $$;

create function private.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, email, display_name, avatar_url)
  values(new.id, coalesce(new.email, ''), new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'avatar_url');
  insert into public.user_settings(user_id) values(new.id);
  return new;
end; $$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create function public.reserve_analysis_usage(
  p_user_id uuid,
  p_daily_limit integer,
  p_model text,
  p_metadata jsonb default '{}'::jsonb
)
returns table(event_id uuid, used integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used integer;
  v_event_id uuid;
  v_day date := timezone('utc', now())::date;
begin
  if p_user_id is null or p_daily_limit < 1 or p_model is null or btrim(p_model) = '' then
    raise exception 'invalid analysis reservation';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':' || v_day::text, 0));
  select count(*)::integer into v_used
  from public.usage_events
  where user_id = p_user_id
    and event_type = 'analysis'
    and created_at >= (v_day::timestamp at time zone 'UTC')
    and created_at < ((v_day + 1)::timestamp at time zone 'UTC');
  if v_used >= p_daily_limit then
    return query select null::uuid, v_used;
    return;
  end if;
  insert into public.usage_events(user_id, event_type, model, metadata)
  values(p_user_id, 'analysis', p_model, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_event_id;
  return query select v_event_id, v_used + 1;
end;
$$;
revoke all on function public.reserve_analysis_usage(uuid, integer, text, jsonb) from public, anon, authenticated;
grant execute on function public.reserve_analysis_usage(uuid, integer, text, jsonb) to service_role;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;
-- OAuth tokens and state are server-only. Users access safe projections through app routes.
revoke all on public.gmail_connections, public.oauth_states from authenticated, anon;

commit;
