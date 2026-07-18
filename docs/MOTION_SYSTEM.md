# Motion system

Motion is reserved for continuity and confirmation. Most reading surfaces, metrics, correspondence rows,
and charts stay still so the desk remains calm.

## Animate

- active navigation rule and control feedback: 140ms;
- hover, press, focus, and copy confirmation: 140–220ms;
- mobile index entrance and dismiss: 220–300ms;
- loading-to-content and empty/error appearance: a short opacity transition;
- task completion and reopening: a local state transition only.

## Keep still

- large page headings and metric values;
- dense inbox and task ledgers;
- email body content and evidence;
- charts after initial presentation;
- decorative background layers.

Use opacity and small transforms, never fake progress, looping decoration, expensive blur, or animation
that delays interaction. `prefers-reduced-motion: reduce` disables nonessential movement and smooth
scrolling while preserving visible state changes.
