# Inb0x design system

The frontend is tokenized in `src/app/globals.css`. The visual system is intentionally compact and
signal-led: a near-black canvas, blue/cyan connective states, red urgency, and amber uncertainty.
The redesign adds an editorial composition layer over the same public contracts and shared primitives,
so every domain screen feels like one product rather than a set of dashboard cards.

| Token              | Value     | Use                           |
| ------------------ | --------- | ----------------------------- |
| `--canvas`         | `#07090D` | page canvas                   |
| `--surface-1`      | `#0C1016` | base panel                    |
| `--surface-2`      | `#111822` | elevated panel                |
| `--surface-3`      | `#172230` | active/inset surface          |
| `--text-primary`   | `#F7F8FB` | primary copy                  |
| `--text-secondary` | `#AEB9C8` | body copy                     |
| `--text-muted`     | `#758397` | metadata                      |
| `--border-subtle`  | `#1D2835` | quiet separation              |
| `--border-strong`  | `#334455` | controls/focus context        |
| `--signal-red`     | `#FF5264` | critical/primary action       |
| `--signal-cyan`    | `#6BE0EC` | connected/success alternative |
| `--signal-blue`    | `#86A8FF` | secondary data                |
| `--warning`        | `#F2BD72` | warning/uncertain state       |

No green-family color is part of the UI palette. Priority uses red, amber, cyan, and slate. Charts use
red and cyan series with labelled text summaries. Geometry uses `--radius-sm` (5px), `--radius-md` (9px),
and `--radius-lg` (14px); pill-shaped text controls are prohibited. Editorial rules use a single strong
page-header rule, thin signal rails, restrained borders, and selective depth instead of a wall of cards.
