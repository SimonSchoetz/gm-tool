# SF1: Domain entity-type vocabulary

Establishes one canonical list of mentionable entity types, replacing two independent, undeclared registries of the same six strings (`MentionPopupContent.tsx`'s switch and `buildEntityPath.ts`'s `ENTITY_SEGMENT` keys) with a single typed source that SF2 also consumes.

## Files affected

**New:**

- `domain/mentions/entityTypes.ts`

**Modified:**

- `domain/mentions/index.ts` — add exports
- `domain/mentions/buildEntityPath.ts` — consume the canonical type instead of an untyped `Record<string, string>`
- `domain/mentions/__tests__/buildEntityPath.test.ts` — the existing `'returns root-scoped session path'` test asserts `buildEntityPath('sessions', 'sess-1', null)` resolves to `/session/sess-1`; this assertion goes stale once `sessions` is removed from `ENTITY_SEGMENT`

## Layered breakdown

### Domain

**`domain/mentions/entityTypes.ts` (new)**

```ts
export const MENTIONABLE_ENTITY_TYPES = [
  'npcs',
  'foes',
  'pcs',
  'factions',
  'locations',
  'items',
] as const;

export type MentionableEntityType = (typeof MENTIONABLE_ENTITY_TYPES)[number];

export const isMentionableEntityType = (
  value: string,
): value is MentionableEntityType =>
  (MENTIONABLE_ENTITY_TYPES as readonly string[]).includes(value);
```

The six values are exactly the tables seeded with `tagging_enabled: 1` in `db/_migrations/1780099200000_seed_table_config.ts` — `adventures` and `sessions` are seeded with `tagging_enabled: 0` and can never be tagged, so they are not part of this list.

**`domain/mentions/buildEntityPath.ts` (modified)**

Current content indexes an untyped `Record<string, string>` keyed by six entity-type strings plus a seventh, `sessions`. `buildEntityPath` has exactly two callers in the codebase (`MentionPopup.tsx`, `MentionBadge.tsx`), both passing a mention's `entityType`, which can only ever be one of the six `tagging_enabled: 1` tables — `sessions` can never reach this function as an argument. Remove the `sessions` entry as dead code and change the map's declared type from `Record<string, string>` to `Record<MentionableEntityType, string>`, which makes the mapping compiler-checked for completeness against SF1's canonical list:

```ts
import { isMentionableEntityType, type MentionableEntityType } from './entityTypes';

const ENTITY_SEGMENT: Record<MentionableEntityType, string> = {
  npcs: 'npc',
  foes: 'foe',
  pcs: 'pc',
  factions: 'faction',
  locations: 'location',
  items: 'item',
};

export const buildEntityPath = (
  entityType: string,
  entityId: string,
  adventureId: string | null,
): string => {
  if (!isMentionableEntityType(entityType)) {
    throw new Error(`buildEntityPath: unknown entityType "${entityType}"`);
  }
  const segment = ENTITY_SEGMENT[entityType];
  return adventureId
    ? `/adventure/${adventureId}/${segment}/${entityId}`
    : `/${segment}/${entityId}`;
};
```

The function signature is unchanged (`entityType: string`) — callers are untouched. The behavioral difference for an unrecognized `entityType` is none: both the old and new implementations throw the same error shape for a value not present in the map.

**`domain/mentions/index.ts` (modified)**

Add to the existing explicit-named-exports barrel:

```ts
export {
  MENTIONABLE_ENTITY_TYPES,
  isMentionableEntityType,
  type MentionableEntityType,
} from './entityTypes';
```

Consumed by SF2's service-layer validation.

## Test coverage

`domain/mentions/__tests__/buildEntityPath.test.ts` already exists. Its `'returns root-scoped session path'` test (asserting `buildEntityPath('sessions', 'sess-1', null)` resolves to `/session/sess-1`) must be rewritten: `sessions` is no longer in `ENTITY_SEGMENT`, so this call now throws. Rename the test to `'throws for the sessions entity type'` and change its body to:

```ts
expect(() => buildEntityPath('sessions', 'sess-1', null)).toThrow(
  'buildEntityPath: unknown entityType "sessions"',
);
```

The existing `'throws for unknown entity types'` test (asserting on `'stories'`) is unaffected and needs no change. No other existing assertion changes — the six retained entity types behave identically.
