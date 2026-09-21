---
paths: ["app/util/**", "util/**"]
---

# Unit tests under `util/`

Every function module in the app-root `util/` (`@util`, the home of a generic helper consumed in more than one layer — `app/src/CLAUDE.md` — Util vs. Helper Placement, rung 4) has a test in a parallel `__tests__/` directory mirroring the file name, as `__tests__/getDateString.test.ts` mirrors `getDateString.ts`. The two exceptions to the required scope are stated in `.claude/rules/src-unit-tests.md` — Testing Policy.
