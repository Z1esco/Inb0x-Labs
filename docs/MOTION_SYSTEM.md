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

## Marketing refinement

Marketing chapters may enter once with an 18px translation and opacity over 540ms.
One observer controls these entrances; animation handles, observers and preference
listeners are cleaned up. Reduced-motion changes cancel active animations immediately.
Product images, walkthrough answers and prewritten reply tones transition over 220–300ms.
The mobile menu uses 220ms opacity/translation: it is visible immediately on opening,
inert immediately on closing, then hidden after its dismissal. Escape restores trigger
focus. There are no scroll handlers, timers, autoplay or animation dependencies.
Operational reading surfaces retain the restrained motion rules above.
