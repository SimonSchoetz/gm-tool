# SF6 — Extract Coordinated Image Removal

Add `removeNpcImage` and `removeAdventureImage` service functions that coordinate image deletion and FK nulling in a single try/catch. Expose each as a DAL mutation. Simplify sidebar components to call one mutation instead of two separate service calls.

Complete SF2 before this sub-feature. Both sub-features touch `NpcSidebar.tsx` and `AdventureScreenSidebar.tsx` at different locations.

## Files Affected

Modified:
- `app/services/npcsService.ts`
- `app/services/adventureService.ts`
- `app/src/data-access-layer/npcs/useNpc.ts`
- `app/src/data-access-layer/adventures/useAdventure.ts`
- `app/src/screens/npc/components/NpcSidebar/NpcSidebar.tsx`
- `app/src/screens/adventure/components/AdventureScreenSidebar/AdventureScreenSidebar.tsx`

## Services Changes

### `app/services/npcsService.ts`

Add a new exported function after `updateNpc`:

```ts
export const removeNpcImage = async (npcId: string): Promise<void> => {
  try {
    const npc = await getNpcById(npcId);
    if (!npc.image_id) return;
    await imageService.deleteImage(npc.image_id);
    await npcDb.update(npcId, { image_id: null });
  } catch (err) {
    throw npcUpdateError(npcId, err);
  }
};
```

`getNpcById` is already defined in this file — no new import needed. `imageService` and `npcDb` are already imported. `npcUpdateError` is already imported from `@domain/npcs`.

After `if (!npc.image_id) return;`, TypeScript narrows `npc.image_id` to `string` — `imageService.deleteImage(npc.image_id)` is type-correct. `npcDb.update(npcId, { image_id: null })` is valid because `UpdateNpcInput.image_id` accepts `null`.

No other changes to this file in this sub-feature. (SF4 changes `deleteNpc` separately; these are non-overlapping.)

### `app/services/adventureService.ts`

Add a new exported function after `updateAdventure`:

```ts
export const removeAdventureImage = async (adventureId: string): Promise<void> => {
  try {
    const adventure = await getAdventureById(adventureId);
    if (!adventure.image_id) return;
    await imageService.deleteImage(adventure.image_id);
    await adventureDb.update(adventureId, { image_id: null });
  } catch (err) {
    throw adventureUpdateError(adventureId, err);
  }
};
```

`getAdventureById`, `imageService`, `adventureDb`, and `adventureUpdateError` are all already imported or defined in this file. No new imports needed.

No other changes to this file in this sub-feature. (SF4 changes `deleteAdventure` separately.)

## DAL Changes

### `app/src/data-access-layer/npcs/useNpc.ts`

Three changes:

**1. Update `UseNpcReturn` type** — add `removeNpcImage`:

```ts
export type UseNpcReturn = {
  npc: Npc | null;
  loading: boolean;
  updateNpc: (data: UpdateNpcData) => void;
  deleteNpc: () => Promise<void>;
  removeNpcImage: () => Promise<void>;
};
```

**2. Add `removeNpcImageMutation`** — place after `deleteMutation`:

```ts
const removeNpcImageMutation = useMutation({
  mutationFn: () => service.removeNpcImage(npcId),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: npcKeys.detail(npcId) });
    void queryClient.invalidateQueries({ queryKey: npcKeys.list(adventureId) });
  },
});
```

**3. Add `removeNpcImage` wrapper** — place after `deleteNpc`:

```ts
const removeNpcImage = async (): Promise<void> => {
  await removeNpcImageMutation.mutateAsync();
};
```

**4. Add to return object**:

```ts
return {
  npc: npcData ?? null,
  loading: isLoadingNpc,
  updateNpc,
  deleteNpc,
  removeNpcImage,
};
```

The `service` import already covers `removeNpcImage` via the namespace import `import * as service from '@services/npcsService'`. No import changes needed.

This sub-feature and SF3 both modify `useNpc.ts`. SF3 changes `updateMutation` (lines ~38–49); this sub-feature adds new mutations after `deleteMutation`. The two edits are non-overlapping — apply them in any order.

### `app/src/data-access-layer/adventures/useAdventure.ts`

Three changes:

**1. Update `UseAdventureReturn` type** — add `removeAdventureImage`:

```ts
type UseAdventureReturn = {
  adventure: Adventure | null;
  loading: boolean;
  updateAdventure: (data: UpdateAdventureData) => void;
  deleteAdventure: () => Promise<void>;
  removeAdventureImage: () => Promise<void>;
};
```

**2. Add `removeAdventureImageMutation`** — place after `deleteMutation`:

```ts
const removeAdventureImageMutation = useMutation({
  mutationFn: () => service.removeAdventureImage(adventureId),
  onSuccess: () => {
    void queryClient.invalidateQueries({ queryKey: adventureKeys.detail(adventureId) });
    void queryClient.invalidateQueries({ queryKey: adventureKeys.list() });
  },
});
```

**3. Add `removeAdventureImage` wrapper** — place after `deleteAdventure`:

```ts
const removeAdventureImage = async (): Promise<void> => {
  await removeAdventureImageMutation.mutateAsync();
};
```

**4. Add to return object**:

```ts
return {
  adventure: adventureData ?? null,
  loading,
  updateAdventure,
  deleteAdventure,
  removeAdventureImage,
};
```

The `service` import already covers `removeAdventureImage` via `import * as service from '@services/adventureService'`. No import changes needed.

This sub-feature and SF3 both modify `useAdventure.ts`. SF3 changes `updateMutation` and adds `debounceTimeoutRef.current = null`; this sub-feature adds new mutations after `deleteMutation`. Non-overlapping — apply in any order.

## Frontend Changes

### `app/src/screens/npc/components/NpcSidebar/NpcSidebar.tsx`

**Purpose:** `NpcSidebar` renders the NPC image upload control and delete button. The image removal now delegates to a single `removeNpcImage` mutation instead of two independent calls.

**Behavior:** When the user removes the NPC's image, `void removeNpcImage()` is called. The service handles image deletion and FK nulling atomically. The `if (npc.image_id)` guard in `deleteFn` remains — it avoids calling the service when there is no image to remove.

**UI / Visual:** No visual change. The delete image flow looks identical to the user.

Three changes:

1. **Remove `useImageMutations` import and destructure.** The `useImageMutations` import from `'@/data-access-layer'` is no longer used. Delete the import line and the `const { deleteImage } = useImageMutations();` destructure.

2. **Add `removeNpcImage` to the `useNpc` destructure:**

   ```ts
   const { npc, updateNpc, deleteNpc, removeNpcImage } = useNpc(npcId, adventureId);
   ```

3. **Replace `deleteFn` body:**

   ```tsx
   deleteFn={() => {
     if (npc.image_id) void removeNpcImage();
   }}
   ```

   Remove the two-line body that previously called `void deleteImage(npc.image_id)` and `updateNpc({ image_id: null })`.

This sub-feature and SF2 both modify `NpcSidebar.tsx`. SF2 adds `?? ''` to `title` and `name` props; this sub-feature changes the `deleteFn` and imports. Non-overlapping — complete SF2 first, then apply this change.

### `app/src/screens/adventure/components/AdventureScreenSidebar/AdventureScreenSidebar.tsx`

**Purpose:** `AdventureScreenSidebar` renders the adventure image upload control and delete button. The image removal now delegates to a single `removeAdventureImage` mutation.

**Behavior:** When the user removes the adventure's image, `void removeAdventureImage()` is called. The `if (adventure.image_id)` guard in `deleteFn` remains.

**UI / Visual:** No visual change.

Three changes:

1. **Remove `useImageMutations` import and destructure.** Delete `import { useAdventure, useImageMutations } from '@/data-access-layer'`; replace with `import { useAdventure } from '@/data-access-layer'`. Delete `const { deleteImage } = useImageMutations();`.

2. **Add `removeAdventureImage` to the `useAdventure` destructure:**

   ```ts
   const { adventure, updateAdventure, deleteAdventure, removeAdventureImage } =
     useAdventure(adventureId);
   ```

3. **Replace `deleteFn` body:**

   ```tsx
   deleteFn={() => {
     if (adventure.image_id) void removeAdventureImage();
   }}
   ```

   Remove the two-line body that previously called `void deleteImage(adventure.image_id)` and `updateAdventure({ image_id: null })`.

This sub-feature and SF2 both modify `AdventureScreenSidebar.tsx`. SF2 adds `?? ''` to `name` in `openDeleteDialog`; this sub-feature changes `deleteFn` and imports. Non-overlapping — complete SF2 first, then apply this change.

## Barrel Files

`app/src/data-access-layer/npcs/index.ts` — no change needed. `UseNpcReturn` is exported from `useNpc.ts` directly (not re-exported by the barrel). Adding a field to it is backwards compatible; no barrel update is required.

`app/src/data-access-layer/adventures/index.ts` — verify it does not export `UseAdventureReturn`. It currently exports `{ useAdventures, useAdventure, adventureKeys }`. `UseAdventureReturn` is a module-internal type and must not be added to the barrel.

`app/src/data-access-layer/index.ts` — no change needed. The grouping barrel already re-exports `useNpc` and `useAdventure` by name. New return-type fields are transparent to the grouping barrel.
