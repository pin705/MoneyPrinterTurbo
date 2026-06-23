# Design system — monochrome, Cursor-grade

The product UI is **monochrome black/white**, in the spirit of Cursor / Linear / Vercel.
This IS the identity.

- **Tokens only.** Use CSS variables / Tailwind tokens (`bg-card`, `text-muted-foreground`,
  `border-border`, `bg-primary` …). Never hard-code a hue for primary/accent/ring.
  - Light `--primary: oklch(0.205 0 0)`; dark `--primary: oklch(0.95 0 0)`. `--accent`,
    `--ring`, sidebar tokens are neutral (chroma 0).
  - **Status hues only**: success / warning / destructive may be colored. Nothing else.
  - No emerald/green primaries, no plastic gradients/glows. If a block looks "plastic,"
    redo it with hairlines, tight radii, and `bg-muted/30` fills.
- **Hairlines & tight radii.** 1px `border-border`, `rounded-lg`/`rounded-xl`, generous padding.
- **Components**: shadcn/ui. Prefer card/box pickers over bare selects for primary choices
  (e.g. `CardSelect` for aspect ratio, template cards on the content plan).
- **Logo/brand**: downward double-chevron (lower chevron fades to grey), monochrome tile.
  Source `brand/app-icon.svg` + `brand/favicon.svg`. See `brand/LOGO_PROMPT.md`.
- **Account cluster**: a single bottom avatar popover (`AccountMenu`), not three separate
  nav items.
- **Loading/empty states** are centered and quiet, never a raw spinner in a corner.

When in doubt, ask: "would this look at home in Cursor?" If not, simplify.
