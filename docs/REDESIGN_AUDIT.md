# Frontend rebuild audit — July 2026

## Baseline

The previous frontend used a familiar dark SaaS shell: permanent icon sidebar, top bar, rounded panels,
equal-weight metric cards, and a red/cyan signal palette. Business flows were complete, but hierarchy was
flattened and the product did not communicate its read-only, decision-focused purpose distinctly enough.

## Chosen direction

**Paper Operations Desk** was selected over two explored alternatives: Monochrome Signal Terminal and
Midnight Correspondence Studio. It created the clearest break from the old UI while keeping long email
reading, evidence review, task acceptance, and reply drafting legible.

The resulting system uses warm paper, deep ink, ultramarine, and copper; a horizontal folio index; ruled
ledgers; letter sheets; and intelligence margins. The visual shell and screen compositions were rebuilt.
Routes, authentication, API calls, mutations, demo data, Gmail permissions, and response contracts were
not changed.

## Screen decisions

- Landing: editorial opening plus a concrete attention brief, followed by method and trust boundaries.
- Login: session authentication and Gmail authorization are shown as separate permissions.
- Dashboard: a single daily brief replaces the card wall.
- Inbox: a correspondence ledger replaces the mailbox/card treatment.
- Thread: normalized letters are primary; analysis is a distinct dark margin note.
- Tasks: explicit task capture sits above an owned-work ledger.
- Replies: a writing room reinforces review and copy-only behavior.
- Insights: questions and distributions replace a generic analytics grid.
- Settings: preferences and permission ledgers use ruled chapters with strong destructive hierarchy.

## QA findings

- Fixed a 23px mobile overflow caused by an unbounded priority column.
- Mobile navigation moves focus to its close control and supports Escape dismissal.
- Loading states preserve final page geometry.
- Focus remains a high-contrast ultramarine outline.
- No Gmail write action, Send control, raw HTML rendering, or provider token presentation was added.

Automated check results and any remaining manual limitations belong in the pull-request verification
summary so this document stays architectural rather than becoming a stale test report.
