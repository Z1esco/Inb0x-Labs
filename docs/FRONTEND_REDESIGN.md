# Frontend redesign — calm intelligence desk

## Product diagnosis

The previous interface was technically consistent but relied too heavily on equal cards, repeated
eyebrows, a conventional SaaS sidebar, and identical surface treatment. That made Dashboard, Inbox,
Tasks, Insights, and Settings feel like separate templates. Priority existed in the data but not in the
composition. The landing preview described a dashboard rather than demonstrating the real decision flow.

The redesign preserves every route and contract while changing the reading model: context is indexed,
attention has rank, rows carry the work, and containers are used only when they establish a workspace.

## Directions considered

### 1. Editorial index — selected

- **Thesis:** A calm intelligence desk where email is ordered like an editorial briefing.
- **Layout:** Compact numbered rail, contextual toolbar, strong page rule, structured rows, asymmetric metrics.
- **Typography:** Sora for decisive moments, Manrope for reading, Space Grotesk for rank and metadata.
- **Color:** Graphite canvas, cyan connective signal, red urgency, amber uncertainty.
- **Surfaces:** Restrained panels with thin dividers and selective depth.
- **Motion:** Immediate control feedback and spatial continuity only.
- **Strength:** Distinctive, dense, readable, and scalable across every route.
- **Risk:** Requires disciplined type hierarchy so compact layouts do not feel severe.

### 2. Quiet paper

- **Thesis:** Email intelligence as a dark editorial publication with warm paper reading surfaces.
- **Layout:** Wide reading columns, narrow annotations, minimal persistent navigation.
- **Strength:** Excellent for thread reading and long-form analysis.
- **Risk:** Less effective for operational task density and dark-only continuity.

### 3. Operations ledger

- **Thesis:** A precise, technical queue for founders and operators.
- **Layout:** Dense tables, strict grid, command-led navigation, minimal visual depth.
- **Strength:** Fast scanning and strong data comparison.
- **Risk:** Too utilitarian for landing, reply writing, and trust-building moments.

The editorial index was selected because it balances scanning, reading, action, accessibility, and
brand distinction without adding a framework or decorative animation.

## Route map

| Route               | Primary task                     | Redesign decision                                                                                         |
| ------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `/`                 | Understand the product and enter | Real attention queue replaces abstract skeleton preview; workflow is a divided editorial sequence.        |
| `/login`            | Enter safely                     | Split statement/action composition replaces the floating auth card; privacy is a numbered assurance list. |
| `/dashboard`        | Know what matters now            | Asymmetric metrics support the focus queue instead of acting as four equal answers.                       |
| `/inbox`            | Scan and select                  | Full-width information workspace with ranked, divided rows and responsive metadata reduction.             |
| `/inbox/[threadId]` | Read and decide                  | Conversation remains dominant; analysis and reply controls stay in a narrower inspector.                  |
| `/tasks`            | Complete owned work              | Dense operational rows, source context, and quick completion remain the primary model.                    |
| `/drafts`           | Review copy-only replies         | Structured review rows preserve confidence and manual-copy meaning.                                       |
| `/insights`         | Understand patterns              | Metrics support questions and charts rather than becoming decorative tiles.                               |
| `/settings`         | Manage intent and trust          | Sections use quieter surfaces, clear dividers, and a narrower account/privacy inspector.                  |

Loading preserves final geometry. Empty states explain the absence and next action. Errors retain safe
copy and recovery. Success remains compact and inline.

## Visual system

- Canvas: rich near-black with a restrained signal field, never a moving decorative gradient.
- Grid: 224px editorial rail, flexible content canvas, 320–420px contextual inspector where useful.
- Radius: 5/9/14px; textual pills are prohibited.
- Type: display, body, and data roles are explicit and never interchangeable.
- Depth: thin borders and content grouping first; shadows only clarify elevation.
- Status: color always appears with text or position, never as the sole meaning.
- Icons: one existing stroke system; generic sparkle symbolism is removed from authentication.

## Motion opportunity audit

| Screen       | Element                |    Frequency | Benefit                            | Risk                | Decision                                                 |
| ------------ | ---------------------- | -----------: | ---------------------------------- | ------------------- | -------------------------------------------------------- |
| Global       | Active navigation rail | Route change | Preserves location and continuity  | Low                 | Animate color/transform in 180ms.                        |
| Mobile       | Navigation drawer      |   Occasional | Explains where the rail came from  | Low                 | Animate transform in 220ms.                              |
| Tasks        | Completion state       |     Frequent | Confirms a deliberate state change | Medium              | Keep immediate state feedback; avoid celebratory motion. |
| Reply Studio | Copy confirmation      |   Occasional | Confirms clipboard action          | Low                 | Use compact status change; no animation dependency.      |
| Settings     | Save feedback          |   Occasional | Confirms persistence               | Low                 | Inline status only; skip decorative motion.              |
| Inbox        | Dense row scanning     |     Constant | None                               | High distraction    | Skip. Rows remain stable.                                |
| Dashboard    | Metrics and charts     |   Every load | Little user benefit                | Comparison delay    | Skip. Data appears immediately.                          |
| Thread       | Email body             |   Every open | None                               | Slower reading      | Skip. Content remains still.                             |
| Landing      | Product preview        |         Once | Adds compositional depth           | Can become gimmicky | Static angle only; no loop or forced scroll.             |
| Loading      | Skeleton replacement   |   Occasional | Preserves geometry                 | Shimmer fatigue     | Keep subtle CSS shimmer; disable under reduced motion.   |

Motion uses transform and opacity, remains under 360ms, and is removed or reduced through
`prefers-reduced-motion`. No motion library or continuous render loop was added.

## Preserved engineering boundaries

The redesign does not modify API routes, Supabase clients or policies, Gmail behavior, OpenAI behavior,
authentication, public contracts, database migrations, demo data, or server services. Gmail remains
read-only and Reply Studio remains copy-only.

## Manual verification still required

- Practical screen-reader pass in VoiceOver, NVDA, or Narrator.
- Keyboard-only review of destructive confirmations and provider redirects.
- Production-font rendering on Safari and high-DPI Windows displays.
- Hosted OAuth states with dedicated disposable accounts.

## Visual QA evidence

Baseline and redesigned captures are stored in `docs/screenshots/redesign/before` and
`docs/screenshots/redesign/after`. The after set covers Landing, Login, Dashboard, Inbox, thread
detail with Reply Studio, Tasks, Drafts, Insights, and Settings at 1440px; primary workflows were
also captured at 390px. Representative baseline captures preserve the earlier Landing, Dashboard,
Inbox, thread-detail, and Settings compositions for comparison.

The rendered pass found and fixed three P0 responsive defects:

1. Mobile inbox text was hidden by an over-broad metadata selector.
2. The mobile navigation icon inherited a rule intended only for toolbar context text.
3. Thread detail and Settings re-applied desktop-specific grids after the shared responsive rule,
   causing their inspectors to overlap primary content.

All three were re-captured after correction. Desktop route captures showed no horizontal overlap or
clipped primary actions. The fixed bottom navigation intentionally remains visible while scrolling;
page padding preserves access to the final content. A browser-extension caret style produced a local
development hydration warning during one controlled browser run; the mismatch originated from the
extension's injected inline style and was not present in the application source.
