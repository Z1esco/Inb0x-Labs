-- PROPOSAL ONLY. Not in supabase/migrations; not applied to any database.
-- Five informational Advisor findings; obtain owner approval and validate in an
-- isolated database first. CONCURRENTLY must run outside a transaction.
create index concurrently if not exists oauth_states_user_idx
  on public.oauth_states(user_id);
create index concurrently if not exists reply_drafts_analysis_idx
  on public.reply_drafts(email_analysis_id);
create index concurrently if not exists reply_drafts_thread_idx
  on public.reply_drafts(email_thread_id);
create index concurrently if not exists tasks_analysis_idx
  on public.tasks(email_analysis_id);
create index concurrently if not exists tasks_thread_idx
  on public.tasks(email_thread_id);
