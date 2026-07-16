# Inb0x frontend design authority

This document is the source of truth for visual decisions in Inb0x. Read it after
`PROJECT_RULES.md` and before changing frontend-owned files.

## Product personality

Inb0x is a dark control room for inbox overload: premium, editorial, calm under pressure, and
specific to turning noise into a signal. The interface should feel composed and useful before it
feels impressive. The visual concept is **noise becomes signal**.

## Visual foundations

- Dark-first canvas: `#080B10`; panels step through cool slate surfaces rather than white cards.
- Signal red (`#FF4D5E`) marks urgency and critical attention.
- Cool cyan (`#65D9E8`) marks connected, safe, and confirmed states.
- Electric blue (`#6F9BFF`) supports secondary data; amber (`#F4B860`) marks warnings.
- Text uses crisp white, balanced blue-slate secondary text, and muted slate metadata.
- Green, emerald, lime, teal, and mint are prohibited in UI colors, charts, status dots, and focus rings.
- Text-containing controls never use capsule geometry. Use 4–6px labels, 8–12px controls, and 12–18px panels.
- `rounded-full` is reserved for avatars, status dots, progress rings, and justified icon-only circles.
- Gradients are directional light or chart depth only; no generic AI orbs, blobs, sparkles, or glass walls.

## Type and icon language

Use Sora for display headings, Manrope for interface copy, and Space Grotesk for metrics and technical
metadata. CSS fallbacks are required for offline builds. Use the shared inline SVG `Icon` wrapper with
one consistent stroke family; never use emoji as interface icons. Icon-only controls need accessible labels.

## Components and states

Routes compose feature views; generic primitives live in `src/components/page-primitives.tsx`; domain
components own dashboard, inbox, replies, tasks, insights, and settings presentation. Every screen needs
loading geometry, empty explanation, partial data, retryable error, and demo-state treatment. Never replace
a real error with demo data. Email content is rendered as text only.

## Motion

Use CSS transitions for the current foundation: 120–180ms micro interactions, 180–280ms standard
transitions, and 240–360ms panels. Animate opacity and transforms, not layout dimensions. Respect
`prefers-reduced-motion` by removing movement and stagger while preserving state clarity.

## Responsive and accessibility rules

Design for 360×800, 390×844, 768×1024, 1024×768, 1280×800, 1440×900, and 1920×1080. Mobile uses a
purpose-built bottom navigation and summary-first lists. Use landmarks, logical headings, visible focus,
keyboard operation, labelled form controls, non-color status meaning, and safe confirmation flows.

## Product boundaries

Gmail is read-only. Reply Studio is copy-only and never presents a Send action. Task creation from an
analysis item requires explicit user action. Dashboard and Insights show only fields supported by the
existing contracts. Demo data is fictional and deterministic; no visual treatment may imply that demo
data came from a real mailbox.

## QA checklist

Before a frontend PR, inspect desktop/tablet/mobile screenshots, scan for prohibited color words and
values, review every rounded-full match, test keyboard focus and reduced motion, verify no horizontal
overflow, and confirm no provider token, raw HTML, prompt, email body, or send action reaches the UI.
