# Frontend composition inventory

| Component                    | Responsibility                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------- |
| `AppNav`                     | horizontal folio header, route index, account menu, mobile drawer and bottom navigation |
| `PageShell`                  | editorial page opening, primary landmark, action position                               |
| `Surface` / `SurfaceHeader`  | compatibility primitives for structured states; not generic card styling                |
| `MetricCard`                 | ruled ledger metric, never a floating dashboard tile                                    |
| `EmptyState` / `ErrorState`  | structurally stable quiet and interrupted states                                        |
| `Icon`                       | square-stroke functional iconography                                                    |
| `DashboardView`              | daily briefing, attention queue, condition margin, supporting ledgers                   |
| `InboxView`                  | compact correspondence index, search, and explicit filters                              |
| `ThreadView`                 | letter stack with a separate intelligence margin                                        |
| `DraftStudio` / `DraftsView` | copy-only writing desk and saved reply index                                            |
| `TaskBoard`                  | explicit task capture and owned-work ledger                                             |
| `InsightsView`               | question-led patterns and supported measures                                            |
| `SettingsPanel`              | preferences, permissions, usage, Gmail, and data controls                               |

New shared components must express a repeated composition or behavior. Do not introduce a component
solely to wrap a border, background, or spacing value.
