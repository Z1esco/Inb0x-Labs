begin;

alter table public.tasks
  add column source_message_id text,
  add column source_action_key text,
  add column source_evidence text,
  add column priority_rank smallint generated always as (
    case priority
      when 'critical' then 4
      when 'high' then 3
      when 'medium' then 2
      when 'low' then 1
      else 0
    end
  ) stored;

alter table public.tasks drop constraint tasks_source_check;
alter table public.tasks drop constraint tasks_title_check;

update public.tasks
set source = 'email_action',
    source_action_key = encode(
      extensions.digest(user_id::text || ':' || id::text || ':legacy', 'sha256'),
      'hex'
    )
where source = 'email';

update public.tasks
set completed_at = coalesce(completed_at, updated_at)
where status = 'completed';

update public.tasks
set completed_at = null
where status <> 'completed';

alter table public.tasks
  add constraint tasks_title_check check (char_length(btrim(title)) between 1 and 200),
  add constraint tasks_description_check check (
    description is null or char_length(description) <= 2000
  ),
  add constraint tasks_source_check check (
    source in ('manual', 'email_action', 'email_deadline', 'email_meeting')
  ),
  add constraint tasks_source_message_check check (
    source_message_id is null or char_length(source_message_id) between 1 and 200
  ),
  add constraint tasks_source_action_key_check check (
    source_action_key is null or source_action_key ~ '^[0-9a-f]{64}$'
  ),
  add constraint tasks_source_evidence_check check (
    source_evidence is null or char_length(source_evidence) <= 300
  ),
  add constraint tasks_source_shape_check check (
    (
      source = 'manual'
      and email_thread_id is null
      and email_analysis_id is null
      and source_message_id is null
      and source_action_key is null
      and source_evidence is null
    )
    or
    (
      source <> 'manual'
      and source_action_key is not null
    )
  ),
  add constraint tasks_completion_check check (
    (status = 'completed' and completed_at is not null)
    or (status <> 'completed' and completed_at is null)
  ),
  add constraint tasks_user_source_action_unique unique (user_id, source_action_key);

create index tasks_user_source_idx on public.tasks(user_id, source, created_at desc);
create index tasks_user_due_idx on public.tasks(user_id, due_at, id);
create index tasks_user_priority_idx on public.tasks(user_id, priority_rank desc, created_at desc);

create function private.validate_task_source_ownership()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  analysis_thread_id uuid;
begin
  if new.email_thread_id is not null and not exists (
    select 1
    from public.email_threads
    where id = new.email_thread_id and user_id = new.user_id
  ) then
    raise exception 'invalid task source thread';
  end if;

  if new.email_analysis_id is not null then
    select email_thread_id into analysis_thread_id
    from public.email_analyses
    where id = new.email_analysis_id and user_id = new.user_id;

    if analysis_thread_id is null or analysis_thread_id <> new.email_thread_id then
      raise exception 'invalid task source analysis';
    end if;
  end if;

  return new;
end;
$$;

create trigger tasks_validate_source_ownership
before insert or update of user_id, email_thread_id, email_analysis_id
on public.tasks
for each row execute function private.validate_task_source_ownership();

-- Browser clients may read their own rows through RLS, but all task mutations pass
-- through strict server routes so protected source fields cannot be forged directly.
grant select on public.tasks to authenticated;
revoke insert, update, delete on public.tasks from authenticated;
revoke all on public.tasks from anon;

commit;
