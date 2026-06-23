export const meta = {
  name: 'review-changes',
  description: 'Review the current git diff across dimensions, then adversarially verify each finding',
  phases: [
    { title: 'Review', detail: 'one reviewer per dimension over the diff' },
    { title: 'Verify', detail: 'independent skeptic confirms or refutes each finding' },
  ],
}

// Vidova-specific review lenses. Each reviewer sees the working diff.
const DIMENSIONS = [
  { key: 'correctness', prompt: 'Logic bugs, wrong conditionals, off-by-one, unhandled nulls, broken control flow, regressions.' },
  { key: 'security', prompt: 'Leaked secrets, missing authz, unsafe input, CORS too open, SQL injection, fail-open auth. Recall: real secrets must never be committed; Supabase sb_secret_ is not a JWT secret.' },
  { key: 'cross-stack', prompt: 'Render(Python)/cloud(FastAPI)/web(React)/desktop(Tauri) contracts: API shape drift, env/config mismatches, Postgres-vs-SQLite FK ordering, i18n keys missing from vi.ts, monochrome design tokens violated.' },
  { key: 'simplicity', prompt: 'Dead code, duplication, needless abstraction, things that could reuse existing helpers in @mpt/shared or the api-client.' },
]

const FINDINGS = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'file', 'severity', 'detail'],
        properties: {
          title: { type: 'string' },
          file: { type: 'string', description: 'path:line' },
          severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          detail: { type: 'string' },
          suggestion: { type: 'string' },
        },
      },
    },
  },
}

const VERDICT = {
  type: 'object',
  required: ['isReal', 'reason'],
  properties: {
    isReal: { type: 'boolean', description: 'true only if the issue genuinely exists in the diff' },
    reason: { type: 'string' },
  },
}

const DIFF = 'Run `git --no-pager diff` and `git --no-pager diff --cached` to see the working changes.'

const results = await pipeline(
  DIMENSIONS,
  (d) =>
    agent(
      `${DIFF}\nReview ONLY the changed lines for ${d.key} issues. ${d.prompt}\n` +
        `Repo conventions live in .claude/rules/. Report concrete findings with file:line. ` +
        `If nothing is wrong, return an empty findings array.`,
      { label: `review:${d.key}`, phase: 'Review', schema: FINDINGS },
    ),
  (review) =>
    parallel(
      ((review && review.findings) || []).map((f) => () =>
        agent(
          `Adversarially verify this review finding against the actual diff. Default to ` +
            `isReal=false unless you can point to the specific changed lines that prove it.\n` +
            `Finding: ${f.title}\nFile: ${f.file}\nClaim: ${f.detail}`,
          { label: `verify:${f.file}`, phase: 'Verify', schema: VERDICT },
        ).then((v) => ({ ...f, verdict: v })),
      ),
    ),
)

const confirmed = results
  .flat()
  .filter(Boolean)
  .filter((f) => f.verdict && f.verdict.isReal)
  .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.severity] - { high: 0, medium: 1, low: 2 }[b.severity]))

log(`${confirmed.length} confirmed finding(s)`)
return { confirmed }
