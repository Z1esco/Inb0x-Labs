# Dashboard aggregation API

`GET /api/dashboard` is an authenticated, read-only aggregation over persisted user-owned data. It
accepts an optional validated IANA `timezone` and never calls Gmail or OpenAI, triggers sync or
analysis, generates replies, creates tasks, or mutates data.

The response includes safe Gmail status; overview counts; inbox health; today's focus; at most ten
priority threads; bounded task and copy-only reply summaries; daily usage; seven-day analytics; and
at most fifteen safe activity items. It never contains email bodies, draft bodies, tokens, prompts,
provider identifiers, or another user's metrics. Current analyses count only when their content hash
matches the thread. Overdue/today calculations use the requested timezone and exclude completed tasks.

The health heuristic starts at 75. It subtracts bounded penalties for critical threads (12 each),
high priority (4 each), replies needed (2 each), overdue tasks (5 each), due-today tasks (2 each), and
reauthorization (20). It adds bounded credit for completed tasks, sync within 24 hours, and analyzed
ratio, then clamps to 0–100. Empty inboxes return `insufficient_data`. This is transparent workload
triage, not a mental-health or productivity judgment.

Today's focus deduplicates overdue/due-today tasks, today's deadlines and meetings, high-priority
reply threads, and recent drafts; urgency/time order is capped at 12. Priority threads sort by level,
score, deadline proximity, reply need, and recency. Seven-day trends are timezone-aware and zero-filled.
Estimated time saved is explicitly heuristic: two minutes per analysis, one per accepted extracted
task, and three per reply draft.

Production performs seven parallel, bounded, explicitly user-scoped reads for connection, settings,
threads, analyses, tasks, drafts, and usage. Limits are 200 metadata rows per main collection and 100
drafts. No bodies are selected. RLS remains defense in depth. No migration or external call is added.
Demo mode returns the same deterministic contract without credentials. Performance is not load-tested.
