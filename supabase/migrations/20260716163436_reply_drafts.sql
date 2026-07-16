begin;

alter table public.reply_drafts
  add column thread_content_hash text,
  add column schema_version text,
  add column instructions_hash text,
  add column used_facts jsonb not null default '[]'::jsonb,
  add column uncertain_points jsonb not null default '[]'::jsonb,
  add column warnings jsonb not null default '[]'::jsonb,
  add column evidence jsonb not null default '[]'::jsonb,
  add column input_tokens integer,
  add column output_tokens integer;

update public.reply_drafts as drafts
set thread_content_hash = threads.content_hash,
    schema_version = 'legacy',
    instructions_hash = encode(
      extensions.digest(coalesce(drafts.instructions, ''), 'sha256'),
      'hex'
    )
from public.email_threads as threads
where threads.id = drafts.email_thread_id;

update public.reply_drafts
set confidence = 0.5
where confidence is null;

alter table public.reply_drafts
  alter column thread_content_hash set not null,
  alter column schema_version set not null,
  alter column instructions_hash set not null,
  alter column confidence set not null,
  add constraint reply_drafts_thread_hash_check check (
    thread_content_hash ~ '^[0-9a-f]{64}$'
  ),
  add constraint reply_drafts_instructions_hash_check check (
    instructions_hash ~ '^[0-9a-f]{64}$'
  ),
  add constraint reply_drafts_instructions_check check (
    instructions is null or char_length(instructions) <= 1000
  ),
  add constraint reply_drafts_subject_check check (
    char_length(btrim(subject)) between 1 and 200
  ),
  add constraint reply_drafts_body_check check (
    char_length(btrim(body)) between 1 and 6000
  ),
  add constraint reply_drafts_usage_check check (
    (input_tokens is null or input_tokens >= 0)
    and (output_tokens is null or output_tokens >= 0)
  ),
  add constraint reply_drafts_used_facts_check check (
    jsonb_typeof(used_facts) = 'array' and jsonb_array_length(used_facts) <= 20
  ),
  add constraint reply_drafts_uncertain_points_check check (
    jsonb_typeof(uncertain_points) = 'array' and jsonb_array_length(uncertain_points) <= 15
  ),
  add constraint reply_drafts_warnings_check check (
    jsonb_typeof(warnings) = 'array' and jsonb_array_length(warnings) <= 15
  ),
  add constraint reply_drafts_evidence_check check (
    jsonb_typeof(evidence) = 'array' and jsonb_array_length(evidence) <= 20
  ),
  add constraint reply_drafts_cache_unique unique (
    user_id,
    email_thread_id,
    thread_content_hash,
    prompt_version,
    schema_version,
    model,
    tone,
    length,
    instructions_hash
  );

create index reply_drafts_user_created_idx
  on public.reply_drafts(user_id, created_at desc, id);
create index reply_drafts_user_thread_idx
  on public.reply_drafts(user_id, email_thread_id, updated_at desc);

create function private.validate_reply_source_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  analysis_thread_id uuid;
begin
  if not exists (
    select 1 from public.email_threads
    where id = new.email_thread_id and user_id = new.user_id
  ) then
    raise exception 'invalid reply source thread';
  end if;

  if new.email_analysis_id is not null then
    select email_thread_id into analysis_thread_id
    from public.email_analyses
    where id = new.email_analysis_id and user_id = new.user_id;

    if analysis_thread_id is null or analysis_thread_id <> new.email_thread_id then
      raise exception 'invalid reply source analysis';
    end if;
  end if;
  return new;
end;
$$;

create trigger reply_drafts_validate_source_ownership
before insert or update of user_id, email_thread_id, email_analysis_id
on public.reply_drafts
for each row execute function private.validate_reply_source_ownership();

create function public.reserve_reply_usage(
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
    raise exception 'invalid reply reservation';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_user_id::text || ':reply:' || v_day::text, 0));
  select count(*)::integer into v_used
  from public.usage_events
  where user_id = p_user_id
    and event_type = 'reply'
    and created_at >= (v_day::timestamp at time zone 'UTC')
    and created_at < ((v_day + 1)::timestamp at time zone 'UTC');
  if v_used >= p_daily_limit then
    return query select null::uuid, v_used;
    return;
  end if;
  insert into public.usage_events(user_id, event_type, model, metadata)
  values(p_user_id, 'reply', p_model, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_event_id;
  return query select v_event_id, v_used + 1;
end;
$$;

revoke all on function public.reserve_reply_usage(uuid, integer, text, jsonb)
from public, anon, authenticated;
grant execute on function public.reserve_reply_usage(uuid, integer, text, jsonb)
to service_role;

grant select on public.reply_drafts to authenticated;
revoke insert, update, delete on public.reply_drafts from authenticated;
revoke all on public.reply_drafts from anon;

commit;
