# Vidova — Logo brief & generation prompts

**Brand:** Vidova — an AI studio that turns a topic into a finished short video,
rendered locally. Personality: modern, fast, friendly, trustworthy, a little
playful. Audience: creators & small teams mass-producing Shorts/Reels/TikToks.

**Mark concept:** stacked **chevrons** that read as motion / video frames and as
a forward-leaning **"V"** (Vidova, "play / ship it"). Matches `brand/favicon.svg`
and the in-app + landing mark.

**Colors:** primary **emerald gradient `#10B981` → `#059669`** (accent
`#34D399`), on near-black `#0B0D12` or white. Must stay legible in pure
monochrome too.

**Typography (wordmark):** geometric sans, semibold, tight tracking
(Geist / Inter / Satoshi). Title-case "Vidova"; tint the "ova" emerald
(`#34D399`) as in the app sidebar.

---

## Prompt — app icon / symbol (Midjourney / DALL·E / Ideogram)

> Minimal flat vector app icon for "Vidova", an AI short-video app. A single
> rounded-square tile with a soft emerald diagonal gradient (#10B981 → #059669).
> Centered: two clean white stacked chevrons (like fast-forward / motion frames)
> that subtly read as the letter V, the lower chevron slightly faded. Geometric,
> balanced, generous padding, no text. Crisp at 32px. Modern SaaS aesthetic, à la
> Linear / Vercel. Flat, high contrast, scalable. White background.
> --no text shadow photorealism 3d

Variations: `--ar 1:1`; a monochrome (single emerald) version; a dark-tile
version (mark on #0B0D12); a version where the chevrons are negative space.

## Prompt — full wordmark (lockup)

> Horizontal logo lockup: the stacked-chevron / V mark (emerald #10B981 → #059669
> gradient) to the left of the wordmark "Vidova" in a clean geometric sans,
> semibold, tight tracking, near-black or white text, with "ova" tinted emerald
> #34D399. Balanced optical spacing, vector, minimal, professional. Provide on
> white and on dark.

## Deliverables to request / export

- App icon: `1024×1024` master → favicon `32/16`, macOS `.icns`, Windows `.ico`,
  Tauri icon set (`pnpm --filter @mpt/desktop icon ./app-icon.png`).
- Wordmark: horizontal + stacked, light + dark, SVG + PNG.
- Social: OG image `1200×630` (mark + tagline "AI short videos, rendered on your machine").

> Placeholder mark lives at `brand/favicon.svg` (wired into the web app + landing
> via `/favicon.svg`). Replace these once the final logo is produced.
