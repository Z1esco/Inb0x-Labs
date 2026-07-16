# Component inventory

Shared components are intentionally compact and domain views compose them rather than duplicating
markup.

| Component                    | Responsibility                                            |
| ---------------------------- | --------------------------------------------------------- |
| `AppNav`                     | desktop sidebar, top bar, mobile navigation, active route |
| `PageShell`                  | page title, description, actions, main landmark           |
| `Surface` / `SurfaceHeader`  | restrained panel hierarchy                                |
| `MetricCard`                 | numeric overview with semantic detail                     |
| `EmptyState` / `ErrorState`  | useful empty and retryable failure states                 |
| `Icon`                       | consistent inline SVG stroke and labels                   |
| `DashboardView`              | dashboard API data and focus surfaces                     |
| `InboxView`                  | thread list, search, filters, priority hierarchy          |
| `ThreadView`                 | normalized messages, analysis, actions, evidence          |
| `DraftStudio` / `DraftsView` | copy-only reply generation, review, deletion              |
| `TaskBoard`                  | create, filter, complete, reopen, edit, delete            |
| `InsightsView`               | supported dashboard analytics only                        |
| `SettingsPanel`              | current settings contract, Gmail controls, demo reset     |

New components should serve at least two related states or views before becoming shared primitives.
