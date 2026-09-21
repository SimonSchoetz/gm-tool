---
paths: ["app/src/**/__tests__/**", "src/**/__tests__/**", "app/src/**/helper/**", "src/**/helper/**", "app/src/util/**", "src/util/**"]
---

# Unit tests under `src/`

Which files must not have unit tests at all is decided before a `__tests__/` path exists to read — the Forbidden rule is in `app/src/CLAUDE.md` — Testing Policy.

## Testing Policy

- **Required**: All helper functions (a module directory's `helper/` — `ComponentName/helper/`, or `data-access-layer/<module>/helper/`), helper functions and hooks shared by several data-access-layer modules at the layer root (`data-access-layer/<name>.ts`, such as `useDuplicateMutation.ts`) and util functions (`/src/util/`) must have corresponding tests in a parallel `__tests__/` directory mirroring the file name — including non-function data modules (e.g. a static rule table) placed in a `helper/` or `util/` directory or promoted to the data-access-layer root, or extracted as a Constants Trigger-2 sibling file directly in a component's own directory (e.g. `textFormattingConfig.ts`, `typographicTransformers.ts`; the trigger is defined in `app/src/CLAUDE.md` — Constants). Exception 1: a helper whose entire body is DOM/canvas mutations with no branching, derived data, or multi-step logic is exempt — no independently verifiable output to assert against. Exception 2: a static data module with no transformation logic of its own is exempt when every value it exports is already exercised by a consumer's test asserting the consumer's transformed output. A hook inside a data-access-layer module directory (`data-access-layer/<module>/use<Name>.ts`) is not in this list; one with a deferred save has its own obligation in `.claude/rules/src-data-access-layer.md` — Non-negotiable rules.
- **Geometry and layout calculation helper tests compute the expected value from the same imported constant the implementation reads, never a bare literal that copies that constant's current value — per the shared rules file's Best Practices & Code Quality (the rule beginning "A test earns its place by the regression it catches").** Applies to helpers whose output depends on constants under active visual tuning (spacing, offsets, clamping thresholds, column widths) — a test hardcoding today's numeric output breaks, or worse silently stops verifying anything, every time the constant is tuned with unchanged logic.
  - ❌ BAD: `expect(buildGridTemplate(['a', 'b'], { a: 80 })).toBe('80px minmax(250px, 1fr)')` — `250` copies `DEFAULT_COLUMN_WIDTH`'s current value (`app/src/components/SortableList/helper/__tests__/buildGridTemplate.test.ts`)
  - ✅ GOOD: `` expect(buildGridTemplate(['a', 'b'], { a: 80 })).toBe(`80px minmax(${DEFAULT_COLUMN_WIDTH}px, 1fr)`) `` — imports the constant `buildGridTemplate.ts` itself reads from `SortableList/SortableList.constants.ts`
  - Does not apply to helpers whose output isn't derived from a tunable constant (e.g. string-formatting) — a hardcoded literal expectation there is correct.
