# Dark attention workbench

DESIGN_RULES.md is the visual authority. This document describes the current implementation;
July's paper-light attention desk is superseded. Preserve useful editorial hierarchy and reading
layouts while giving every route a consistent dark surface system.

## Tokens

Source: src/app/globals.css. Hex values remain explicit to match the repository's approved palette.

| Before                     | After                                                           | Role                           |
| -------------------------- | --------------------------------------------------------------- | ------------------------------ |
| --night #171512            | --canvas #080b10                                                | App backdrop, navigation       |
| --night-soft #24211d       | --surface-deep #0a0f17                                          | Recessed surface               |
| --night-muted #9e978d      | --text-secondary #acb9cc                                        | Supporting text on dark panels |
| --paper #f2ede4            | --surface #0c1119                                               | Reading canvas                 |
| --paper-raised #faf7f1     | --surface-raised #121a26                                        | Inputs, focused panels         |
| --paper-deep #e4dccf       | --surface-hover #1a2535                                         | Hover, loading depth           |
| --ink #1b1916              | --text #f0f3fa                                                  | Primary text                   |
| --ink-soft #625d55         | --text-secondary #acb9cc                                        | Supporting copy                |
| --ink-faint #8b847a        | --text-muted #8d9db5                                            | Metadata                       |
| --rule #c8bfb2             | --border #28364a                                                | Subtle separators              |
| --rule-dark #38332d        | --border-strong #41526b                                         | Strong rules, controls         |
| --ultramarine #244bc5      | --signal-blue #6f9bff                                           | Navigation and primary action  |
| --ultramarine-dark #17358f | --signal-cyan #65d9e8                                           | Connected/confirmed state      |
| --copper #c25836           | --signal-red #ff4d5e                                            | Attention/urgency              |
| --danger #a12f2f           | --danger #ff6b79                                                | Destructive/critical text      |
| --warning #98621b          | --warning #f4b860                                               | Warnings and uncertain dates   |
| --focus #244bc5            | --focus #9abaff                                                 | Keyboard outline               |
| #f3ede4                    | var(--text)                                                     | Header copy                    |
| #4a443d                    | var(--border)                                                   | Brand outline                  |
| #6d8cf2                    | var(--signal-cyan)                                              | Confirmed accents              |
| #5a5249                    | var(--border-strong)                                            | Control outline                |
| #7895ef                    | var(--signal-blue)                                              | Navigation accents             |
| #686158                    | var(--text-muted)                                               | Route indices                  |
| #211e1a                    | var(--surface-raised)                                           | Active route                   |
| #bcb4a9                    | var(--text-secondary)                                           | Entry copy                     |
| #c6d2ff                    | var(--signal-blue)                                              | Analysis priority              |
| #d0c8bd                    | var(--text-secondary)                                           | Analysis prose                 |
| #d1c8bb                    | var(--border-strong)                                            | Action outline                 |
| #eee1cc                    | rgba(244,184,96,0.1)                                            | Warning tint                   |
| #dfe5f7                    | rgba(101,217,232,0.08)                                          | Confirmation tint              |
| #eedbd6                    | rgba(255,77,94,0.1)                                             | Error tint                     |
| #26221e                    | var(--surface-raised)                                           | Mobile active route            |
| #61594f                    | var(--border-strong)                                            | Drawer outline                 |
| rgba(152,98,27,0.12)       | rgba(244,184,96,0.08)                                           | Inline warning                 |
| rgba(109,140,242,0.12)     | rgba(101,217,232,0.08)                                          | Inline confirmation            |
| white                      | var(--canvas) on bright actions; var(--text) on dark navigation | Context-aware text contrast    |

No green, teal, mint or lime. Cyan uses the approved cool-blue direction. Color always has text
meaning alongside it. Test actual computed foreground/background pairs in browser QA.

## Typography and composition

Sora owns display headings, Manrope interface and reading copy, Space Grotesk metrics and technical
metadata. Keep system fallbacks. Desktop titles are bounded at 64px; small screens use 32–44px
headings with wrapping. Correspondence and evidence prioritize reading width over oversized type.

Keep the existing horizontal desktop route index, mobile bottom navigation and full-screen route
drawer. Do not document an unimplemented sidebar. Shared metrics and analysis surfaces use restrained
14px corners; controls use 8px, labels remain rectangular. No text pills, glass walls, glowing orbs,
decorative gradients or new animation dependencies.

## Components and product boundaries

Use current AppNav, page primitives and domain views. Loading, empty, failure and populated states
retain geometry. Email stays inert text. Source references link to messages within the current thread;
confidence, uncertain dates and warnings remain visible. AI actions are explicit, suggested tasks require
acceptance, replies are review-and-copy only, and Gmail is read-only.

Respect reduced motion, focus visibility, keyboard navigation and comfortable touch controls. Test all
routes at 360, 390, 768, 1024, 1280, 1440 and 1920px, with screenshots from fictional data only.
