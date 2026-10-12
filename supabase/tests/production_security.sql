create extension if not exists pgtap with schema extensions;

begin;
select plan(18);

insert into auth.users (
  id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  (
    '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
    'release-user-a@example.test', '{}'::jsonb, '{}'::jsonb, now(), now()
  ),
  (
    '20000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated',
    'release-user-b@example.test', '{}'::jsonb, '{}'::jsonb, now(), now()
  );

insert into public.gmail_connections (
  user_id, google_subject, gmail_address, encrypted_access_token,
  encrypted_refresh_token, granted_scopes
) values
  ('10000000-0000-4000-8000-000000000001', 'google-a', 'a@example.test', 'encrypted-a', 'encrypted-a', array['gmail.readonly']),
  ('20000000-0000-4000-8000-000000000002', 'google-b', 'b@example.test', 'encrypted-b', 'encrypted-b', array['gmail.readonly']);

insert into public.oauth_states (user_id, state_hash, expires_at) values
  ('10000000-0000-4000-8000-000000000001', repeat('a', 64), now() + interval '10 minutes'),
  ('20000000-0000-4000-8000-000000000002', repeat('b', 64), now() + interval '10 minutes');

insert into public.email_threads (
  id, user_id, gmail_thread_id, subject, latest_message_at, content_hash
) values
  ('11000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'thread-a', 'A', now(), repeat('a', 64)),
  ('22000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'thread-b', 'B', now(), repeat('b', 64));

insert into public.email_analyses (
  id, user_id, email_thread_id, content_hash, prompt_version, schema_version,
  model, summary, category, priority_score, priority_level, priority_reason,
  needs_reply, confidence
) values
  (
    '12000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001',
    '11000000-0000-4000-8000-000000000001', repeat('a', 64), 'p1', 's1', 'test',
    'A', 'work', 50, 'medium', 'Test', false, 1
  ),
  (
    '24000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002',
    '22000000-0000-4000-8000-000000000002', repeat('b', 64), 'p1', 's1', 'test',
    'B', 'work', 50, 'medium', 'Test', false, 1
  );

insert into public.tasks (user_id, title, source, status, priority) values
  ('10000000-0000-4000-8000-000000000001', 'Task A', 'manual', 'open', 'medium'),
  ('20000000-0000-4000-8000-000000000002', 'Task B', 'manual', 'open', 'medium');

insert into public.reply_drafts (
  user_id, email_thread_id, email_analysis_id, tone, length, subject, body,
  model, prompt_version, confidence, thread_content_hash, schema_version,
  instructions_hash
) values
  (
    '10000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001',
    '12000000-0000-4000-8000-000000000001', 'balanced', 'short', 'Re: A', 'Draft A',
    'test', 'p1', 1, repeat('a', 64), 's1', repeat('c', 64)
  ),
  (
    '20000000-0000-4000-8000-000000000002', '22000000-0000-4000-8000-000000000002',
    '24000000-0000-4000-8000-000000000002', 'balanced', 'short', 'Re: B', 'Draft B',
    'test', 'p1', 1, repeat('b', 64), 's1', repeat('d', 64)
  );

insert into public.usage_events (user_id, event_type) values
  ('10000000-0000-4000-8000-000000000001', 'audit'),
  ('20000000-0000-4000-8000-000000000002', 'audit');
insert into public.rate_limits (user_id, action, window_started_at) values
  ('10000000-0000-4000-8000-000000000001', 'test', date_trunc('minute', now())),
  ('20000000-0000-4000-8000-000000000002', 'test', date_trunc('minute', now()));

select ok(
  (
    select bool_and(c.relrowsecurity)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(array[
        'profiles', 'gmail_connections', 'email_threads', 'email_analyses',
        'tasks', 'reply_drafts', 'user_settings', 'usage_events', 'oauth_states',
        'rate_limits'
      ])
  ),
  'RLS is enabled on every user-owned table'
);
select ok(not has_table_privilege('authenticated', 'public.gmail_connections', 'select'), 'Gmail tokens are hidden from browser roles');
select ok(not has_table_privilege('authenticated', 'public.oauth_states', 'select'), 'OAuth state is hidden from browser roles');
select ok(
  (
    select bool_and(not has_table_privilege('authenticated', format('public.%I', table_name), privilege))
    from unnest(array[
      'profiles', 'gmail_connections', 'email_threads', 'email_analyses', 'tasks',
      'reply_drafts', 'user_settings', 'usage_events', 'oauth_states', 'rate_limits'
    ]) as tables(table_name)
    cross join unnest(array['insert', 'update', 'delete']) as privileges(privilege)
  ),
  'browser roles cannot mutate server-managed tables directly'
);
select ok(not has_function_privilege('authenticated', 'public.reserve_analysis_usage(uuid,integer,text,jsonb)', 'execute'), 'analysis reservation is not browser executable');
select ok(not has_function_privilege('authenticated', 'public.reserve_reply_usage(uuid,integer,text,jsonb)', 'execute'), 'reply reservation is not browser executable');
select ok(has_function_privilege('service_role', 'public.reserve_analysis_usage(uuid,integer,text,jsonb)', 'execute'), 'service role can reserve analysis usage');
select ok(has_function_privilege('service_role', 'public.reserve_reply_usage(uuid,integer,text,jsonb)', 'execute'), 'service role can reserve reply usage');
select has_trigger('public', 'tasks', 'tasks_validate_source_ownership', 'task source ownership trigger exists');
select has_trigger('public', 'reply_drafts', 'reply_drafts_validate_source_ownership', 'reply source ownership trigger exists');
select ok(
  exists(
    select 1
    from pg_constraint
    where conrelid = 'public.tasks'::regclass
      and conname = 'tasks_user_source_action_unique'
  ),
  'task source deduplication constraint exists'
);
select ok(
  exists(
    select 1
    from pg_constraint
    where conrelid = 'public.reply_drafts'::regclass
      and conname = 'reply_drafts_cache_unique'
  ),
  'reply cache uniqueness constraint exists'
);
select ok(
  (select event_id is not null and used = 1 from public.reserve_analysis_usage('10000000-0000-4000-8000-000000000001', 1, 'test')),
  'first analysis reservation succeeds'
);
select ok(
  (select event_id is null and used = 1 from public.reserve_analysis_usage('10000000-0000-4000-8000-000000000001', 1, 'test')),
  'analysis reservation stops at the daily limit'
);
select ok(
  (select event_id is not null and used = 1 from public.reserve_reply_usage('10000000-0000-4000-8000-000000000001', 1, 'test')),
  'first reply reservation succeeds'
);
select ok(
  (select event_id is null and used = 1 from public.reserve_reply_usage('10000000-0000-4000-8000-000000000001', 1, 'test')),
  'reply reservation stops at the daily limit'
);

set local role authenticated;
select set_config(
  'request.jwt.claims',
  '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);
select ok(
  (select count(*) = 1 from public.profiles)
    and (select count(*) = 1 from public.email_threads)
    and (select count(*) = 1 from public.email_analyses)
    and (select count(*) = 1 from public.tasks)
    and (select count(*) = 1 from public.reply_drafts)
    and (select count(*) = 1 from public.user_settings)
    and (select count(*) = 3 from public.usage_events)
    and (select count(*) = 1 from public.rate_limits),
  'user A sees every owned safe row'
);
select ok(
  (select count(*) = 0 from public.profiles where id = '20000000-0000-4000-8000-000000000002')
    and (select count(*) = 0 from public.email_threads where user_id = '20000000-0000-4000-8000-000000000002')
    and (select count(*) = 0 from public.email_analyses where user_id = '20000000-0000-4000-8000-000000000002')
    and (select count(*) = 0 from public.tasks where user_id = '20000000-0000-4000-8000-000000000002')
    and (select count(*) = 0 from public.reply_drafts where user_id = '20000000-0000-4000-8000-000000000002')
    and (select count(*) = 0 from public.user_settings where user_id = '20000000-0000-4000-8000-000000000002'),
  'user A cannot see user B rows'
);

reset role;
select * from finish();
rollback;
