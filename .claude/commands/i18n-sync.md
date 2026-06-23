---
description: Audit Vietnamese i18n and fill any missing vi.ts translations
allowed-tools: Bash, Read, Edit, Grep, Glob
---

Audit and fix Vietnamese localization. Read `.claude/rules/i18n.md` first.

1. Delegate the audit to the `i18n-reviewer` agent (or do it inline): collect every
   `t("…")` key used in `apps/web/src/` and every `titleKey`/`descKey` from
   `@mpt/shared`, then diff against `apps/web/src/i18n/vi.ts`. List keys with no VI entry.
2. Check landing parity: `apps/landing/src/i18n/landing.ts` `en` vs `vi` objects.
3. For each missing key, add a natural, idiomatic Vietnamese translation to `vi.ts`
   (preserve interpolation tokens like `{{n}}`). Group additions under the right section
   comment. Do NOT translate brand names (Vidova, TikTok, YouTube, SePay).
4. Run `pnpm --filter @mpt/web typecheck` and report what was added.

If `$ARGUMENTS` names a specific file or feature, scope the audit to that.
