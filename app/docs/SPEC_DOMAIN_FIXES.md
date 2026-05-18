# Domain Consistency Fixes

## Progress Tracker

- SF1: Fix `remove.ts` validation — replace inline ID guards with `assertValidId` in all DB domains
- SF2: Make `name` nullable — remove `NOT NULL` from `npcs.name` and `adventures.name`; run one-shot migration; fix downstream type errors `[FOUNDATION: SF6 touches files also touched here — do SF2 before SF6]`
- SF3: Fix `updateMutation` closure — capture entity ID at construction time in all three update hooks
- SF4: Fix `undefined` in service signatures — replace `entity?: T` with `entity: T | null = null` in two service functions; remove TODO comment
- SF5: Remove comment from `npcKeys.ts`
- SF6: Extract coordinated image removal — add `removeNpcImage` / `removeAdventureImage` service functions and DAL mutations; simplify sidebar components

## Key Architectural Decisions

### `assertValidId` is the single validation point for all DB CRUD operations

All DB operations that accept an entity ID must validate it through `assertValidId` from `'../util'`. Inline triple-condition guards (`!id || typeof id !== 'string' || id.trim() === ''`) duplicate logic that `assertValidId` already encapsulates. Diverging error messages per file defeat the purpose of centralised validation.

### `name` is user-editable and therefore must be nullable in SQL and optional in Zod

Per `app/db/CLAUDE.md`: *"Any column whose value is written via a text input that the user can clear entirely must be defined as nullable in the SQL schema and optional in the Zod schema."* The `name` column in both `npcs` and `adventures` is bound to a text `<Input>` that the user can clear. Removing `NOT NULL` and changing `zod: z.string()` to `zod: z.string().optional()` makes the schema faithfully represent this. The `updateZod: z.string()` field is also removed — once the base `zod` is `.optional()`, `generateUpdateSchema` produces the same result without a separate `updateZod`.

### Type propagation from `name: string | undefined`

Changing `name` to `z.string().optional()` changes the TypeScript types `Npc.name` and `Adventure.name` from `string` to `string | undefined`. All callsites that pass `npc.name` or `adventure.name` directly to a prop or parameter typed as a required `string` must add a `?? ''` fallback. These fixes are part of SF2.

### One-shot migration in `database.ts`

No migration infrastructure exists — `database.ts` runs `CREATE TABLE IF NOT EXISTS` only. To make `name` nullable in existing databases, SF2 adds a manual table-recreation migration block directly in `initDatabase`. The user will delete this block after the first run.

### Mutation closure — entity ID captured at construction, never at call time

Per `app/src/CLAUDE.md`: entity identifiers known at hook construction time (`npcId`, `adventureId`, `sessionId`) must be captured in the `mutationFn` closure. The `variables` object must not be used as a workaround to access an id that was already available in the closure.

### `entity?: T` → `entity: T | null = null` in service delete functions

Optional parameters with `?` create `T | undefined` unions, which CLAUDE.md prohibits in business logic. The replacement form `entity: T | null = null` is functionally identical (nullish coalescing `??` handles both) while respecting the null-over-undefined rule.

### Coordinated image removal belongs in the entity's service

Calling `imageService.deleteImage` and then `updateNpc/updateAdventure` from a component is a service-layer gap: if the second call fails, the image record is gone but the entity FK still references it. Per `app/services/CLAUDE.md`: the owning service is the entity whose FK column is being updated — `npcsService` for `npc.image_id`, `adventureService` for `adventure.image_id`. Each service adds a `removeXImage(xId: string)` function that coordinates both steps inside a single try/catch.

## CLAUDE.md Impact

None. All rules that drive these fixes are already present in the current CLAUDE.md files.

## Sub-feature Files

- [SF1 — Fix `remove.ts` validation](SPEC_DOMAIN_FIXES_SF1.md)
- [SF2 — Make `name` nullable](SPEC_DOMAIN_FIXES_SF2.md)
- [SF3 — Fix `updateMutation` closure](SPEC_DOMAIN_FIXES_SF3.md)
- [SF4 — Fix `undefined` in service signatures](SPEC_DOMAIN_FIXES_SF4.md)
- [SF5 — Remove comment from `npcKeys.ts`](SPEC_DOMAIN_FIXES_SF5.md)
- [SF6 — Extract coordinated image removal](SPEC_DOMAIN_FIXES_SF6.md)
