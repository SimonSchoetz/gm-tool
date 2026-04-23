# SF3: Default Step Name Derivation

Stop writing `name` to the DB for default steps at creation. Derive default step display names from `LAZY_DM_STEPS` in the two components that render them.

## Files Affected

**Modified:**
- `app/src/services/sessionStepService.ts`
- `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/components/StepSectionHeaderTitle/StepSectionHeaderTitle.tsx`
- `app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/StepSectionHeader.tsx`

**New:** none

## Layered Breakdown

### Services

**`app/src/services/sessionStepService.ts`**

In `initDefaultSteps`, remove `name: step.name` from the `create()` call. The call becomes:

```ts
await sessionStepDb.create({
  session_id: sessionId,
  sort_order: index,
  default_step_key: step.key,
});
```

No other changes to this file.

### Frontend

**`app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/components/StepSectionHeaderTitle/StepSectionHeaderTitle.tsx`**

**Purpose:** Renders the step title — a read-only label for default steps, an editable input for custom steps.

**Behavior:**
- Reads `step` from `useSessionSteps` via `stepId` (unchanged).
- If `step.default_step_key !== null`: look up the display name with `LAZY_DM_STEPS.find((s) => s.key === step.default_step_key)?.name`. Render as `<label className='step-name' htmlFor={`step-checkbox-${step.id}`}>` containing the resolved name. If no definition is found (defensive: should not occur), render `null`.
- If `step.default_step_key === null`: render the `<Input>` with `value={stepName}` and the debounced `updateStep` call, identical to current behavior. The `stepName` and `syncedStepId` state variables are still required for this branch.

**UI / Visual:** No visual change. The label text now comes from `LAZY_DM_STEPS` instead of `step.name`.

Add import:

```ts
import { LAZY_DM_STEPS } from '@/domain';
```

**Dead code removed:** `step.name` is no longer read in the default branch. The `useState(step?.name ?? '')` initialization no longer depends on DB data for default steps — both `useState` calls remain because they serve the custom step branch.

---

**`app/src/screens/session/components/PrepView/components/StepSection/components/StepSectionHeader/StepSectionHeader.tsx`**

**Purpose:** Renders the full header row for a step section, including the delete dialog.

**Behavior:**
- All behavior is unchanged except the name passed to `DeleteDialog`.
- If `step.default_step_key !== null`: resolve the name from `LAZY_DM_STEPS.find((s) => s.key === step.default_step_key)?.name`, falling back to `'Untitled Step'` if not found.
- If `step.default_step_key === null`: use `step.name ?? 'Untitled Step'` as before.

**UI / Visual:** No visual change.

Add import:

```ts
import { LAZY_DM_STEPS } from '@/domain';
```

Replace the `name` prop on `<DeleteDialog>`:

```ts
name={
  step.default_step_key !== null
    ? (LAZY_DM_STEPS.find((s) => s.key === step.default_step_key)?.name ?? 'Untitled Step')
    : (step.name ?? 'Untitled Step')
}
```

No other changes to this file.
