# SF1 — Canonical entity registry

Promotes the entity vocabulary out of `domain/mentions/` into a new `domain/entities/` module and widens it from seven members to eight by adding `adventures`.

## Files affected

**Moved:**

- `mv app/domain/mentions/entityTypes.ts app/domain/entities/entityTypes.ts`, then rename all three exported symbols and add the `adventures` member
- `mv app/domain/mentions/entityTypeLabels.ts app/domain/entities/entityTypeLabels.ts`, then add the `adventures` entry and update the import to the renamed symbols
- `mv app/domain/mentions/buildEntityPath.ts app/domain/entities/buildEntityPath.ts`, then add the `adventures` segment, update the import to the renamed symbols, and throw the new error factory
- `mv app/domain/mentions/__tests__/entityTypeLabels.test.ts app/domain/entities/__tests__/entityTypeLabels.test.ts`, then update the `'adventures'` assertion
- `mv app/domain/mentions/__tests__/buildEntityPath.test.ts app/domain/entities/__tests__/buildEntityPath.test.ts`, then add the adventures case and update the throwing-case import

**New:**

- `app/domain/entities/errors.ts`
- `app/domain/entities/index.ts`

**Modified:**

- `app/domain/mentions/errors.ts` — remove `MentionEntityTypeError` and `mentionEntityTypeError`; `mentionSearchError` stays
- `app/domain/mentions/index.ts` — remove the five moved exports; retains only the two `mentionSearchError` exports
- `app/domain/index.ts` — re-point the moved exports at `./entities` under their new names
- `app/services/mentionSearchService.ts` — `isMentionableEntityType` → `isEntityType`, imported from `@domain/entities`
- `app/db/mention-search.ts` — the `getById` comment names "the canonical mentionable entity type list"; restate it as the canonical entity type list

## Domain layer

### `domain/entities/entityTypes.ts`

Moved from `domain/mentions/entityTypes.ts`. Three renames and one added member; the guard's implementation is unchanged.

| Before | After |
| --- | --- |
| `MENTIONABLE_ENTITY_TYPES` | `ENTITY_TYPES` |
| `MentionableEntityType` | `EntityType` |
| `isMentionableEntityType` | `isEntityType` |

`ENTITY_TYPES` gains `'adventures'`. Member order is not significant; append it.

### `domain/entities/errors.ts`

New file holding the error factory relocated from `domain/mentions/errors.ts`. `mentionEntityTypeError` had exactly one caller — `buildEntityPath` — so it moves with its thrower rather than staying behind in a module that no longer contains anything that throws it.

Rename to `entityTypeError` / `EntityTypeError`. Follow the factory-function pattern in `app/CLAUDE.md` — TypeScript Coding Style. Message: `` `Unknown entity type: "${entityType}"` ``.

### `domain/entities/entityTypeLabels.ts`

Moved. Add `adventures: 'Adventure'` to `ENTITY_TYPE_LABELS`. Update the import to `isEntityType` / `EntityType`. `entityTypeLabel`'s `'Entity'` fallback stays — it guards against arbitrary strings, not against known members.

### `domain/entities/buildEntityPath.ts`

Moved. Add `adventures: 'adventure'` to `ENTITY_SEGMENT`. Update the import to `isEntityType` / `EntityType`, and throw `entityTypeError` instead of `mentionEntityTypeError`.

The path-building expression itself is unchanged. Adventures resolves correctly through the existing null branch because it is configured `scope: 'global'`, so its callers pass `adventureId: null` and the expression yields `/adventure/{entityId}` — which is the adventure item route. Do not add a branch for it.

### `domain/entities/index.ts`

Module directory barrel. Explicit named exports per `app/db/CLAUDE.md` and `app/CLAUDE.md`; `export *` is banned. Export `ENTITY_TYPES`, `isEntityType`, `type EntityType`, `entityTypeLabel`, `buildEntityPath`, `entityTypeError`, and `type EntityTypeError`.

### `domain/mentions/index.ts`

Reduces to the two `mentionSearchError` exports. Keep the existing explicit-named-export style.

### `domain/index.ts`

Grouping barrel. Explicit named exports; `export *` is banned.

The existing `./mentions` blocks currently carry seven symbols. Reduce them to `MentionSearchError` (type) and `mentionSearchError` (value), and add a new `./entities` block exporting `EntityType` and `EntityTypeError` as types, and `ENTITY_TYPES`, `isEntityType`, `entityTypeLabel`, `buildEntityPath`, and `entityTypeError` as values.

Place the `./entities` block adjacent to the `./mentions` block, following the file's existing one-block-per-module layout.

`entityTypeLabel` and `buildEntityPath` keep their names and stay exported from `@domain`, so the four components importing them from that specifier — `MentionPopup.tsx`, `MentionBadge.tsx`, `DeletedMentionContent.tsx`, `MentionOptionList.tsx` — need no change and are correctly absent from this sub-feature's Files affected list. Only the source module and the three renamed symbols change.

## Service layer

### `services/mentionSearchService.ts`

`getMentionEntityData`'s guard becomes `isEntityType`. Import it from `@domain/entities`; `mentionSearchError` continues to come from `@domain/mentions`.

Widening the guard to eight members changes this function's behavior for `entityType === 'adventures'`: it now performs the lookup instead of short-circuiting to `{ name: null, deleted: true }`. That is the intended fix. `mention-search.ts`'s `getById` selects `id, name, updated_at`, and the `adventures` table has all three, so no query change is required.

`searchMentions` needs no change — it filters on `tagging_enabled` and never consulted the type list.

## Tests

### `domain/entities/__tests__/entityTypeLabels.test.ts`

Moved. One assertion changes and one is added:

- The existing `expect(entityTypeLabel('adventures')).toBe('Entity')` becomes `expect(entityTypeLabel('adventures')).toBe('Adventure')`.
- Add a case asserting the fallback still holds for a genuinely unknown type: `expect(entityTypeLabel('stories')).toBe('Entity')`.

The seven existing per-type assertions are unchanged.

### `domain/entities/__tests__/buildEntityPath.test.ts`

Moved. Two additions, covering the two distinct path-construction branches named in the Key Architectural Decisions section:

- `adventure path uses the global-scope branch` — `expect(buildEntityPath('adventures', 'adv-1', null)).toBe('/adventure/adv-1')`
- `adventure-scoped entity path uses the nested branch` — already covered by the existing `npcs` assertion; leave it as the representative of that branch.

The existing throwing case asserts on `buildEntityPath('stories', 'id-1', null)`. Keep the input; the thrown error is now `entityTypeError`, so update the expected message to `Unknown entity type: "stories"`.

No test file exists for `entityTypes.ts` today and none is added — `isEntityType` is a single `.includes` call with no branching.
