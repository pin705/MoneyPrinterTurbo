export const meta = {
  name: 'i18n-audit',
  description: 'Audit the web app for user-facing strings missing a Vietnamese translation in vi.ts',
  phases: [
    { title: 'Scan', detail: 'one auditor per feature folder' },
    { title: 'Merge', detail: 'dedupe and report the fix-list' },
  ],
}

// Feature areas of apps/web/src to scan in parallel.
const AREAS = [
  'src/features/generator',
  'src/features/plan',
  'src/features/library',
  'src/features/dashboard',
  'src/features/auth',
  'src/components',
]

const MISSING = {
  type: 'object',
  required: ['missing'],
  properties: {
    missing: {
      type: 'array',
      items: {
        type: 'object',
        required: ['key', 'file'],
        properties: {
          key: { type: 'string', description: 'the English source string passed to t()' },
          file: { type: 'string', description: 'path:line where it is used' },
          suggestedVi: { type: 'string', description: 'a natural Vietnamese translation' },
        },
      },
    },
  },
}

const perArea = await parallel(
  AREAS.map((area) => () =>
    agent(
      `In apps/web/${area}, find every user-facing string passed to t("…") (and any ` +
        `titleKey/descKey from @mpt/shared rendered via t()). For each, check whether the ` +
        `key exists in apps/web/src/i18n/vi.ts. Report ONLY keys that are MISSING from vi.ts ` +
        `(they would fall back to English in the default VI UI). Preserve interpolation ` +
        `tokens like {{n}}. Do not flag brand names (Vidova, TikTok, YouTube, SePay). ` +
        `Suggest a natural Vietnamese translation for each.`,
      { label: `scan:${area.split('/').pop()}`, phase: 'Scan', schema: MISSING },
    ),
  ),
)

// Merge + dedupe by key (plain code — no agent needed).
const seen = new Set()
const missing = []
for (const r of perArea.filter(Boolean)) {
  for (const m of r.missing || []) {
    if (!seen.has(m.key)) {
      seen.add(m.key)
      missing.push(m)
    }
  }
}

log(`${missing.length} string(s) missing a VI translation`)
return { missing }
