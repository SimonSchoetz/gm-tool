# /refine-claude applied batch — pnpm CLAUDE.md sync

Approved by user in chat: "apply all, then commit, then merge to main"
(batch = the four proposals in `01-refine-claude-proposals.md`, F1–F4).

Applied verbatim as proposed, no adjustments:

- F1 — `/home/user/gm-tool/CLAUDE.md`, Development Commands section:
  `npm run dev`/`npm run web` → `pnpm run dev`/`pnpm run web` (code block
  + prose sentence).
- F2 — `/home/user/gm-tool/.claude/CLAUDE.md`, cut-release registry entry:
  `npm run create-release` → `pnpm run create-release` (Output and
  Constraints fields).
- F3 — `/home/user/gm-tool/.claude/commands/implement.md:78`:
  `npm test` → `pnpm test`.
- F4 — `/home/user/gm-tool/.claude/agents/spec-writer.md:100`:
  `package-lock.json`/`npm install` → `pnpm-lock.yaml`/`pnpm install`
  (both occurrences in the sentence).

Verified post-apply: `grep -n "npm run\|npm test\|npm install\|package-lock"`
across all four target files returns zero stale matches.
