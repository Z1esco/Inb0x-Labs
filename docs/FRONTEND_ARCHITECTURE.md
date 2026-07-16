# Frontend architecture

The frontend uses the Next.js App Router with server route composition and client feature views only
where interaction or browser APIs are required.

## Ownership and layers

- `src/app/(marketing)` and `src/app/(auth)` compose landing and sign-in experiences.
- `src/app/(dashboard)` owns route composition and delegates product UI to components.
- `src/components` contains the shared shell, visual primitives, and domain views.
- `src/lib/api-client.ts` is the only browser-to-backend boundary.
- `src/types/contracts.ts` remains the source of truth for public response shapes.
- `src/mock` remains deterministic fixture data for demo mode.

`AppNav`, `PageShell`, `Surface`, `MetricCard`, `EmptyState`, and `ErrorState` are shared foundation
components. Dashboard, inbox, thread, drafts, tasks, insights, and settings views own domain-specific
interaction without introducing global state or a second data-fetching library.

## Data behavior

Demo pages may receive a server-rendered fixture for fast first paint, then use the same API client
contract for interactive mutations. Real mode shows loading, empty, and safe error states and never
falls back to fictional data. Rendering a page never triggers Gmail sync, analysis, reply generation,
or mailbox mutation.

## Adding a feature

Start with the existing route and contract. Add a focused domain component, reuse the shared primitives,
keep API calls in `apiClient`, and add a test for the loading/error/empty interaction. Do not move
frontend-owned files or change backend services to make UI composition easier.
