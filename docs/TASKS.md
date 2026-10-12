# Task management

Tasks are user-controlled records. OpenAI analysis may suggest action items, but analysis never
creates tasks automatically. A user must explicitly create a task from a stored action item or
create one manually.

## Flows

Manual creation accepts only title, description, priority, and due date. The server assigns
`source=manual`, `status=open`, and `completedAt=null`; source ownership fields are rejected.

Extracted creation accepts only an owned analysis UUID and a bounded action index. The server loads
the stored, schema-validated action item and copies its title, description, due date, source message
ID, and short evidence excerpt. Priority maps directly from the analysis. Vague or unresolved dates
remain null.

The resulting task keeps safe links to the owning email thread and analysis. It never stores the full
email, raw HTML, provider IDs, prompts, tokens, or client-supplied evidence.

## Idempotency

Email-derived tasks use a SHA-256 source-action key derived from the authenticated user, analysis,
source message, normalized title and description, due date, and evidence. The database unique
constraint on `user_id + source_action_key` is the final concurrency guard. Repeated requests return
the existing task with `created=false` and `duplicate=true`. Manual tasks have a null source key and
are not deduplicated.

## Lifecycle

Statuses are `open`, `in_progress`, and `completed`; `in_progress` is retained because it already
exists in the public frontend contract. Completion timestamps are server-generated and preserved on
repeated completion. Reopening clears the timestamp. Deletes are hard deletes for the MVP and never
cascade to the source thread or analysis.

## Listing

`GET /api/tasks` supports status, priority, source, due range, thread, limit, opaque cursor, and sort
filters. The default limit is 25 and the server maximum is 100. Null due dates sort last for due-date
sorts. Every production query is explicitly scoped by the authenticated user.

Browser Data API access to tasks is read-only. Writes use the server-only repository so clients cannot
bypass route validation and forge source or completion fields; every privileged query is still scoped
to the authenticated user and checked again by database constraints and the ownership trigger.

## Demo mode

Demo mode contains seven fictional accepted tasks and supports the same manual creation,
create-from-analysis, duplicate prevention, filtering, pagination, completion, reopening, deletion,
and reset behavior without Supabase, Gmail, or OpenAI credentials. Generated demo IDs and timestamps
are deterministic after reset.
