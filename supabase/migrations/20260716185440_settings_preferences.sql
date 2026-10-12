begin;

alter table public.user_settings
  add column timezone text not null default 'UTC'
    check (char_length(timezone) between 1 and 100),
  add column locale text not null default 'en'
    check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  add column appearance text not null default 'system'
    check (appearance in ('light', 'dark', 'system')),
  add column default_landing_page text not null default 'dashboard'
    check (default_landing_page in ('dashboard', 'inbox', 'tasks')),
  add column compact_mode boolean not null default false,
  add column show_analytics boolean not null default true,
  add column show_inbox_health boolean not null default true,
  add column show_recent_activity boolean not null default true;

commit;
