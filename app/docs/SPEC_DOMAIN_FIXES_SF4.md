# SF4 — Fix `undefined` in Service Signatures

Replace `entity?: T` optional parameters with `entity: T | null = null` default parameters in two service delete functions. Remove the multi-line TODO comment from `adventureService.ts`.

## Files Affected

Modified:
- `app/services/npcsService.ts`
- `app/services/adventureService.ts`

## Services Changes

### `app/services/npcsService.ts`

Change the `deleteNpc` function signature from:

```ts
export const deleteNpc = async (id: string, npc?: Npc): Promise<void> => {
```

to:

```ts
export const deleteNpc = async (id: string, npc: Npc | null = null): Promise<void> => {
```

The body is unchanged. `npc ?? (await getNpcById(id))` works identically with `null` as the default — nullish coalescing treats `null` and `undefined` equivalently.

### `app/services/adventureService.ts`

Two changes:

1. Change the `deleteAdventure` function signature from:

   ```ts
   export const deleteAdventure = async (
     id: string,
     adventure?: Adventure,
   ): Promise<void> => {
   ```

   to:

   ```ts
   export const deleteAdventure = async (
     id: string,
     adventure: Adventure | null = null,
   ): Promise<void> => {
   ```

2. Remove the multi-line comment block above the `try` statement in `deleteAdventure`:

   ```ts
   /**
    * TODO: Needs to delete all corresponding sessions ect. in the future
    */
   ```

   Delete these three lines entirely. The body of `deleteAdventure` is otherwise unchanged.

## DB, DAL, Frontend

No changes.
