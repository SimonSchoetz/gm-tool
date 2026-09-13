---
paths: ["app/src/**/__tests__/**", "src/**/__tests__/**", "app/src/**/helper/**", "src/**/helper/**", "app/src/util/**", "src/util/**"]
---

# Unit tests under `src/`

Which files must not have unit tests at all is decided before a `__tests__/` path exists to read — the Forbidden rule is in `app/src/CLAUDE.md` — Testing Policy.

## Testing Policy

- **Required**: All helper functions (`ComponentName/helper/`) and util functions (`/src/util/`) must have corresponding tests in a parallel `__tests__/` directory mirroring the file name — including non-function data modules (e.g. a static rule table) placed in either directory, or extracted as a Constants Trigger-2 sibling file directly in a component's own directory (e.g. `textFormattingConfig.ts`, `typographicTransformers.ts`; the trigger is defined in `app/src/CLAUDE.md` — Constants). Exception 1: a helper whose entire body is DOM/canvas mutations with no branching, derived data, or multi-step logic is exempt — no independently verifiable output to assert against. Exception 2: a static data module with no transformation logic of its own is exempt when every value it exports is already exercised by a consumer's test asserting the consumer's transformed output.
- **Geometry and layout calculation helper tests must assert the relationship, computed from the same imported constants the implementation uses — never bake current numeric values into a separate literal expectation.** Applies to helpers whose output depends on constants under active visual tuning (spacing, offsets, clamping thresholds). A test hardcoding today's numeric output breaks — or worse, silently stops verifying the real relationship — every time the constant is tuned, even with unchanged logic.
  - ❌ BAD: `expect(calculateHintPosition(anchor)).toBe(anchor.top + 8)` — `8` copies `HINT_OFFSET`'s current value; tuning it to `12` breaks this test with no logic change
  - ✅ GOOD: `expect(calculateHintPosition(anchor)).toBe(anchor.top + HINT_OFFSET)` — imports the same constant the implementation reads, tracking tuning changes automatically
  - Does not apply to helpers whose output isn't derived from a tunable constant (e.g. string-formatting) — a hardcoded literal expectation there is correct.
