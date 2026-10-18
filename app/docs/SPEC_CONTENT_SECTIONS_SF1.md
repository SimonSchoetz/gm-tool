# Sub-feature 1: Session-step lookups

Give three facts about session steps one home each before Sub-feature 3 moves the steps nav's code: the lazy-DM step definition for a key (`LAZY_DM_STEPS.find((s) => s.key === …)`, inline in six files), a step's display name (`step.name ?? lazyStep?.name ?? 'Untitled Step'`, inline in two), and the DOM id of a step's section (`` `step-section-${id}` ``, inline in three — two set it, the steps nav reads it to scroll). Behavior is unchanged. Commit type: `chore`.

## Files affected

- `Modified:`
  - `app/domain/session-steps/lazyDmSteps.ts` — add `findLazyDmStep`
  - `app/domain/session-steps/index.ts` — export `findLazyDmStep` and `sessionStepName`
  - `app/src/screens/session/components/PrepView/components/StepSection/StepSection.tsx` — element id and placeholder lookup
  - `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/StepSectionHeader.tsx` — display name
  - `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/components/StepSectionHeaderTitle/StepSectionHeaderTitle.tsx` — definition lookup
  - `app/src/screens/session/components/PrepView/components/StepSection/components/TooltipPanel/TooltipPanel.tsx` — definition lookup
  - `app/src/screens/session/components/InGameView/InGameView.tsx` — pass `stepId` instead of the step row
  - `app/src/screens/session/components/InGameView/components/InGameStepSection/InGameStepSection.tsx` — element id; props-pattern and data-prop fixes
  - `app/src/screens/session/components/InGameView/components/InGameStepSection/components/InGameStepSectionTitle/InGameStepSectionTitle.tsx` — definition lookup
- `Deleted:` none
- `New:`
  - `app/domain/session-steps/sessionStepName.ts`
  - `app/domain/session-steps/__tests__/lazyDmSteps.test.ts`
  - `app/domain/session-steps/__tests__/sessionStepName.test.ts`
  - `app/src/screens/session/helper/stepSectionElementId.ts`
  - `app/src/screens/session/helper/__tests__/stepSectionElementId.test.ts`
- `Moved:` none
- `Draft:` none

`[DEFERRED-VIOLATION: Best Practices & Code Quality — two or more independent instances of one domain fact — app/src/screens/session/components/StepsNavSidebar/components/SessionStepsNav/components/SortableStepItem.tsx]`
`SortableStepItem.tsx` keeps its own copy of all three expressions in this sub-feature. Sub-feature 3 deletes the file and moves its code into `SessionStepsNav.tsx`, written against the homes created here; editing it now would be thrown away one sub-feature later.

## Domain

### `app/domain/session-steps/lazyDmSteps.ts` — Modified

Add, below `LAZY_DM_STEPS`:

- `export const findLazyDmStep = (key: LazyDmStepKey | null): LazyDmStepDefinition | null` — the `LAZY_DM_STEPS` entry whose `key` equals `key`; `null` when `key` is `null` or nothing matches. `LazyDmStepDefinition` stays module-private; `LAZY_DM_STEPS` stays exported, because `app/services/sessionService.ts` iterates it to seed a new session's steps.

Accepting `null` lets every call site pass `step.default_step_key` (typed `LazyDmStepKey | null` by `app/db/session-step/schema.ts`) without its own null guard.

### `app/domain/session-steps/sessionStepName.ts` — New

- `export const sessionStepName = (name: string | null, defaultStepKey: LazyDmStepKey | null): string` — `name` when it is not `null` (an empty string is returned as-is, exactly as `StepSectionHeader.tsx`'s current `??` chain does), else `findLazyDmStep(defaultStepKey)?.name`, else `'Untitled Step'`.

### `app/domain/session-steps/index.ts` — Modified

Explicit named exports, matching the file's existing style: change `export { LAZY_DM_STEPS } from './lazyDmSteps';` to `export { LAZY_DM_STEPS, findLazyDmStep } from './lazyDmSteps';` and add `export { sessionStepName } from './sessionStepName';`. `domain/index.ts` already re-exports the subdomain with `export * from './session-steps'`, so both reach `@domain` with no further change.

### Tests — New

`app/domain/session-steps/__tests__/lazyDmSteps.test.ts` (`describe('findLazyDmStep')`, following `app/domain/entities/__tests__/entityTypeLabels.test.ts`):

- `returns the definition for a known key` — `findLazyDmStep('strong_start')?.name` is `'Strong Start'`. Catches a lookup comparing the wrong field, or returning the first definition regardless of key.
- `returns null for a null key` — `findLazyDmStep(null)` is `null` (`toBeNull`). Catches `Array.prototype.find`'s `undefined` leaking out instead of `null`.

`app/domain/session-steps/__tests__/sessionStepName.test.ts` (`describe('sessionStepName')`):

- `returns the custom name over the default step's name` — `sessionStepName('Ambush', 'strong_start')` is `'Ambush'`. Catches the definition's name overriding a name the GM typed.
- `returns the default step's name when the step has no custom name` — `sessionStepName(null, 'strong_start')` is `'Strong Start'`. Catches a missing definition fallback.
- `returns 'Untitled Step' when the step has neither a name nor a default key` — `sessionStepName(null, null)` is `'Untitled Step'`. Catches the final fallback returning `''` or `undefined`.
- `keeps an empty custom name` — `sessionStepName('', 'strong_start')` is `''`. Catches a `||` chain replacing an emptied custom name with the default step's name, which would change what `StepSectionHeader` shows today.

## Frontend

### `app/src/screens/session/helper/stepSectionElementId.ts` — New

- `export const stepSectionElementId = (stepId: string): string` — returns `` `step-section-${stepId}` ``.

Placement: this is the first `helper/` directly under a screen module. Its consumers — `StepSection` (under `PrepView/`), `InGameStepSection` (under `InGameView/`) and, from Sub-feature 3, `SessionStepsNav` (under `StepsNavSidebar/`) — are descendants of the `screens/session/` module, so the helper is promoted to that module's own `helper/` (`app/src/CLAUDE.md` — Util vs. Helper Placement, rung 1). `screens/session/` has an `index.ts`; every importer sits inside that boundary, so the relative imports below pass `local/no-import-past-index`. Only files inside `app/src/screens/session/` import it.

Test — `app/src/screens/session/helper/__tests__/stepSectionElementId.test.ts`:

- `returns the step section's element id` — `stepSectionElementId('abc')` is `'step-section-abc'`. The id is the contract between the element that carries it and the nav that scrolls to it; catches a format change that would silently break the scroll.

### `StepSection.tsx` — Modified

- **Purpose:** unchanged — one step's section in the prep view.
- **Behavior:** ``id={`step-section-${stepId}`}`` → `id={stepSectionElementId(stepId)}`, imported from `'../../../../helper/stepSectionElementId'`; the `TextEditor` placeholder → `findLazyDmStep(step.default_step_key)?.placeholder ?? ''`; the `@domain` import changes from `LAZY_DM_STEPS` to `findLazyDmStep`.
- **UI / Visual:** unchanged.

### `StepSectionHeader.tsx` — Modified

- **Purpose:** unchanged — a prep step's header row.
- **Behavior:** replace the `lazyStep` and `stepName` lines with `const stepName = sessionStepName(step.name, step.default_step_key);` and import `sessionStepName` from `@domain` in place of `LAZY_DM_STEPS`; the delete dialog still names the step `Step: <stepName>`.
- **UI / Visual:** unchanged.

### `StepSectionHeaderTitle.tsx` — Modified

- **Purpose:** unchanged — a prep step's title, read-only for a default step, editable otherwise.
- **UI / Visual:** unchanged.
- **Behavior:** inside the existing `if (step.default_step_key)` branch, `const definition = findLazyDmStep(step.default_step_key);`; the `if (!definition) return;` guard stays. Import `findLazyDmStep` from `@domain` in place of `LAZY_DM_STEPS`.

### `TooltipPanel.tsx` — Modified

- **Purpose:** unchanged — a default step's tooltip.
- **UI / Visual:** unchanged.
- **Behavior:** `const definition = findLazyDmStep(stepKey);`; the guard stays. Same import swap.

### `InGameStepSectionTitle.tsx` — Modified

- **Purpose:** unchanged — an in-game step's title.
- **UI / Visual:** unchanged.
- **Behavior:** inside the existing `if (step.default_step_key)` branch, `const definition = findLazyDmStep(step.default_step_key);`; the rest of the branch stays. Same import swap. Its own name logic (`if (step.name)`, so an empty name falls through to the definition, and no `'Untitled Step'` fallback) gives a different result than `sessionStepName` for an empty or missing name; replacing it would change what the in-game title shows, so it stays.

### `InGameStepSection.tsx` — Modified

- **Purpose:** unchanged — one step's read-only section in the in-game view, carrying the element id the steps nav scrolls to.
- **Behavior:** `id={stepSectionElementId(step.id)}` from `'../../../../helper/stepSectionElementId'`. Two convention violations in this file are fixed in the same pass (root `CLAUDE.md` — Best Practices & Code Quality, Active check on touched files):
  - Props pattern (`.claude/rules/src-components.md` — Props pattern, case 3): `type Props = { stepId: string };` and `export const InGameStepSection: FCProps<Props> = ({ stepId }) => …`, replacing `({ step }: InGameStepSectionProps)`.
  - Data relayed as a prop (`.claude/rules/src-components.md` — Framework context is not a prop): the component reads its step itself — it already calls `useSessionSteps(sessionId)`; take `steps` from it as well, `const step = steps.find((s) => s.id === stepId);`, and `if (!step) return;` before the JSX, as `StepSection.tsx` does. The `SessionStep` type import goes away.
- **UI / Visual:** unchanged.

### `InGameView.tsx` — Modified

- **Purpose:** unchanged — the in-game view of a session.
- **UI / Visual:** unchanged.
- **Behavior:** `<InGameStepSection key={step.id} step={step} />` → `<InGameStepSection key={step.id} stepId={step.id} />`.

## Verification

Run the every-check rows of root `CLAUDE.md` — Tool Use Discipline from `app/`: `npx tsc --noEmit`, `npx eslint .`, `npx prettier --check .`.

Human-tester hand-off (`pnpm run dev` only — `pnpm run web` cannot reach the database, root `CLAUDE.md` — Running the application): on a session in prep view, a default step shows its lazy-DM name, placeholder and tooltip; clicking a step in the steps nav still scrolls to it; in the in-game view each step section still shows its title and content.
