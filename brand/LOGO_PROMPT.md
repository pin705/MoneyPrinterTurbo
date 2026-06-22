# Vidova — Logo brief & generation prompts

**Brand:** Vidova — an AI studio that turns a topic into a finished short video,
rendered locally. Personality: precise, fast, quiet-premium — a developer-tool
aesthetic in the spirit of Cursor / Linear / Vercel.

**Mark concept:** stacked **chevrons** that read as motion / video frames and as
a forward-leaning **"V"**. Matches `brand/favicon.svg` and the in-app + landing
mark.

**Colors: MONOCHROME.** No color accent. Near-black tile `#161618`–`#27272a`
with a white `#FAFAFA` mark, OR the inverse (white tile, near-black mark). Must
read perfectly in pure black & white — that IS the identity. Status hues
(green/amber/red) appear only in product UI, never in the logo.

**Typography (wordmark):** geometric sans, semibold, tight tracking
(Geist / Inter). Title-case "Vidova" in a single ink color (white on dark,
black on light) — no two-tone, no colored letters.

---

## Prompt — app icon / symbol (Midjourney / DALL·E / Ideogram)

> Minimal flat vector app icon for "Vidova", an AI short-video app. A single
> rounded-square tile in near-black (#18181B) with two clean white (#FAFAFA)
> stacked chevrons (like fast-forward / motion frames) that subtly read as the
> letter V, the lower chevron slightly faded. Strictly monochrome — black and
> white only, no color, no gradient hue. Geometric, balanced, generous padding,
> no text. Crisp at 32px. Developer-tool aesthetic à la Cursor / Linear / Vercel.
> Flat, high contrast, scalable. --no color text shadow photorealism 3d

Variations: `--ar 1:1`; inverse (near-black mark on a white tile); a version
where the chevrons are formed by negative space in a solid tile.

## Prompt — full wordmark (lockup)

> Horizontal logo lockup: the stacked-chevron / V mark (white on a near-black
> rounded tile) to the left of the wordmark "Vidova" in a clean geometric sans,
> semibold, tight tracking, single ink color. Strictly black & white, minimal,
> high-contrast, professional. Provide on white and on near-black backgrounds.

## Deliverables to request / export

- App icon: `1024×1024` master → favicon `32/16`, macOS `.icns`, Windows `.ico`,
  Tauri icon set (`pnpm --filter @mpt/desktop icon ./app-icon.png`).
- Wordmark: horizontal + stacked, light + dark, SVG + PNG.
- Social: OG image `1200×630` (mark + tagline "AI short videos, rendered on your machine").

> Placeholder mark: `brand/favicon.svg` (monochrome, wired into the web app +
> landing via `/favicon.svg`). Replace once the final logo is produced.
