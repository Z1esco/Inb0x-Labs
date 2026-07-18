# Inb0x design system

The frontend is tokenized in `src/app/globals.css`. The visual system is intentionally compact and
signal-led: a near-black canvas, blue/cyan connective states, red urgency, and amber uncertainty.
The redesign adds an editorial composition layer over the same public contracts and shared primitives,
so every domain screen feels like one product rather than a set of dashboard cards.

| Token              | Value     | Use                           |
| ------------------ | --------- | ----------------------------- |
| `--canvas`         | `#080B10` | page canvas                   |
| `--surface-1`      | `#0E131A` | base panel                    |
| `--surface-2`      | `#131A23` | elevated panel                |
| `--surface-3`      | `#19222E` | active/inset surface          |
| `--text-primary`   | `#F5F7FA` | primary copy                  |
| `--text-secondary` | `#A8B3C2` | body copy                     |
| `--text-muted`     | `#718094` | metadata                      |
| `--border-subtle`  | `#202B38` | quiet separation              |
| `--border-strong`  | `#344354` | controls/focus context        |
| `--signal-red`     | `#FF4D5E` | critical/primary action       |
| `--signal-cyan`    | `#65D9E8` | connected/success alternative |
| `--signal-blue`    | `#6F9BFF` | secondary data                |
| `--warning`        | `#F4B860` | warning/uncertain state       |

No green-family color is part of the UI palette. Priority uses red, amber, cyan, and slate. Charts use
red and cyan series with labelled text summaries. Geometry uses `--radius-sm` (5px), `--radius-md` (9px),
and `--radius-lg` (14px); pill-shaped text controls are prohibited. Editorial rules use a single strong
page-header rule, thin signal rails, restrained borders, and selective depth instead of a wall of cards.
