# Frontend accessibility

Inb0x uses semantic landmarks, a skip link, a logical heading hierarchy, visible focus rings, native
form controls, labelled icon-only buttons, and text alongside status color. Mobile navigation remains
keyboard reachable and uses minimum comfortable control heights. Conversation bodies are rendered as
plain text; no raw email HTML is injected.

Error and reset actions use safe user-facing messages. Copy confirmation uses a status announcement, and
task controls expose labels such as `Complete <task>` and `Reopen <task>`. Warning and critical states are
also described in text, never communicated by color alone.

Before release, test keyboard traversal, focus visibility, screen-reader headings, browser zoom, and
reduced-motion behavior at the responsive sizes documented in `DESIGN_RULES.md`.
