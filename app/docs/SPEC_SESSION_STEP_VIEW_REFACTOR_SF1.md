# SF1: LazyDmStepKey SSoT

Move the canonical `LazyDmStepKey` type and its backing const array to `db/session-step/schema.ts`. Remove the duplicate union type from the domain layer. Update all consumers.

## Files Affected

**Modified:**
- `app/db/session-step/schema.ts`
- `app/db/session-step/index.ts`
- `app/db/session-step/__tests__/create.test.ts`
- `app/src/domain/session-steps/lazyDmSteps.ts`
- `app/src/domain/session-steps/index.ts`
- `app/src/domain/index.ts`
- `app/src/screens/session/components/PrepView/components/StepSection/components/TooltipPanel/TooltipPanel.tsx`

**New:** none

## Layered Breakdown

### DB

**`app/db/session-step/schema.ts`**

Before the `defineTable` call, add:

```ts
export const LAZY_DM_STEP_KEYS = [
  'review_characters',
  'strong_start',
  'potential_scenes',
  'secrets_clues',
  'fantastic_locations',
  'important_npcs',
  'relevant_monsters',
  'magic_items',
] as const;

export type LazyDmStepKey = typeof LAZY_DM_STEP_KEYS[number];
```

In the `default_step_key` column definition, replace the inline `z.enum([...])` call (with all 8 string literals) with:

```ts
zod: z.enum(LAZY_DM_STEP_KEYS).nullable().optional(),
```

All other columns are unchanged.

**`app/db/session-step/index.ts`**

Add after the existing exports:

```ts
export { LAZY_DM_STEP_KEYS } from './schema';
export type { LazyDmStepKey } from './schema';
```

All existing exports (`create`, `get`, `getAllBySession`, `update`, `remove`, and the three types from `./types`) are unchanged.

**`app/db/session-step/__tests__/create.test.ts`**

Add a test case for creating a step with `default_step_key`. The `buildCreateQuery` utility iterates validated object keys in schema column order (session_id → name → content → default_step_key → checked → sort_order). With only `session_id`, `default_step_key`, and `sort_order` provided, the INSERT columns are `id, session_id, default_step_key, sort_order` in that order.

Add after the existing "should create session step with optional name included" test:

```ts
it('should create session step with default_step_key', async () => {
  const result = await create({
    session_id: 'sess-1',
    sort_order: 0,
    default_step_key: 'review_characters',
  });

  expect(mockExecute).toHaveBeenCalledWith(
    'INSERT INTO session_steps (id, session_id, default_step_key, sort_order) VALUES ($1, $2, $3, $4)',
    ['test-generated-id', 'sess-1', 'review_characters', 0],
  );
  expect(result).toBe('test-generated-id');
});
```

### Domain

**`app/src/domain/session-steps/lazyDmSteps.ts`**

Remove the `export type LazyDmStepKey = | 'review_characters' | ...` union declaration (currently lines 1–9).

Add at the top of the file:

```ts
import type { LazyDmStepKey } from '@db/session-step';
```

`LazyDmStepDefinition` and `LAZY_DM_STEPS` are unchanged.

**`app/src/domain/session-steps/index.ts`**

Remove `LazyDmStepKey` from the type re-export line. The line:

```ts
export type { LazyDmStepKey, LazyDmStepDefinition } from './lazyDmSteps';
```

becomes:

```ts
export type { LazyDmStepDefinition } from './lazyDmSteps';
```

All other exports in this file are unchanged.

**`app/src/domain/index.ts`**

Remove `LazyDmStepKey` from the type re-export line for `./session-steps`. The line:

```ts
export type { LazyDmStepKey, LazyDmStepDefinition, SessionStepLoadError, ... } from './session-steps';
```

becomes:

```ts
export type { LazyDmStepDefinition, SessionStepLoadError, ... } from './session-steps';
```

All other exports in this file are unchanged.

### Frontend

**`app/src/screens/session/components/PrepView/components/StepSection/components/TooltipPanel/TooltipPanel.tsx`**

**Purpose:** Displays the tooltip text for a default step by looking up its definition in `LAZY_DM_STEPS`.

**Behavior:** Receives `stepKey: LazyDmStepKey`. Finds the matching entry in `LAZY_DM_STEPS`. Renders `definition.tooltip`. If no matching definition is found, renders nothing. Behavior is unchanged.

**UI / Visual:** No visual change. Only the import source for `LazyDmStepKey` changes.

Change:

```ts
import type { LazyDmStepKey } from '@/domain';
```

to:

```ts
import type { LazyDmStepKey } from '@db/session-step';
```

`LAZY_DM_STEPS` still imports from `@/domain`. All other code is unchanged.
