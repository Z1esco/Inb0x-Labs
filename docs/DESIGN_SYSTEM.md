# Inb0x visual system

The July 2026 rebuild uses an editorial **attention desk** rather than an app-dashboard metaphor. The
interface should feel like a prepared daily brief: one dominant question, strong rules, dense ledgers,
and clear margins for supporting intelligence.

## Palette

| Token            | Value     | Use                                                  |
| ---------------- | --------- | ---------------------------------------------------- |
| `--night`        | `#171512` | navigation, intelligence notes, high-contrast fields |
| `--paper`        | `#F2EDE4` | primary working surface                              |
| `--paper-raised` | `#FAF7F1` | letters, inputs, focused rows                        |
| `--paper-deep`   | `#E4DCCF` | loading blocks and physical depth                    |
| `--ink`          | `#1B1916` | primary content                                      |
| `--ink-soft`     | `#625D55` | supporting copy                                      |
| `--ultramarine`  | `#244BC5` | navigation continuity, focus, selected state         |
| `--copper`       | `#C25836` | time-sensitive attention                             |
| `--danger`       | `#A12F2F` | destructive and critical states                      |

Green, teal, purple-gradient, and decorative-neon treatments are not part of the product palette.

## Type

- Space Grotesk is the display, metric, and index face.
- Manrope is the body, control, and reading face.
- Large titles are intentionally editorial; functional rows stay compact.
- Uppercase is reserved for small folio labels, permission notes, and table headers.

## Geometry and composition

- Use square corners, one-pixel rules, and aligned baselines.
- Do not convert every grouping into a card. Prefer chapters, ledgers, margins, and letter sheets.
- The dark header is a horizontal route index. A persistent left sidebar is not part of this system.
- Controls are rectangular; textual pills and decorative badges are prohibited.
- Page composition may be asymmetric when the primary reading or decision surface remains obvious.

## State language

Loading uses stable ruled placeholders. Empty and error states occupy the same structural region as the
content they replace. Success is communicated with ultramarine plus text; warning uses copper or amber;
danger uses red. Color is never the only signal.
