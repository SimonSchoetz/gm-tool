# SF5 — Detail route loaders

Resolve entity data before detail screens mount, and for entities that carry an image, decode that image before the route renders so the hero image is painted on arrival rather than appearing after it.

## Files affected

- `Modified:` `app/src/routes/adventure.$adventureId.index.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.encounter.$encounterId.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.faction.$factionId.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.foe.$foeId.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.item.$itemId.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.location.$locationId.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.npc.$npcId.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.pc.$pcId.tsx`
- `Modified:` `app/src/routes/adventure.$adventureId.session.$sessionId.tsx`
- `New:` `app/src/data-access-layer/images/ensureImagePainted.ts`
- `Modified:` `app/src/data-access-layer/images/index.ts` — barrel gains `ensureImagePainted`
- `Modified:` `app/src/data-access-layer/index.ts` — grouping barrel gains `ensureImagePainted`
- `Modified:` `app/docs/_product/domain-scaffold.md` — add the route loader as a per-entity-type registration point, stating that an entity's list and detail routes each require a loader awaiting that entity's query options, and that an entity added without one reintroduces the loading flicker on its own screens only

## Data Access Layer

### `ensureImagePainted.ts` (new)

Exports one function that resolves an image query and then waits for the browser to decode the resulting bitmap:

```ts
export const ensureImagePainted = async (
  queryClient: QueryClient,
  imageId: string | null,
): Promise<void> => {
  if (imageId === null) return;

  const { url } = await queryClient.ensureQueryData(imageQueryOptions(imageId));
  if (!url) return;

  const image = new Image();
  image.src = url;
  await image.decode().catch(() => {
    // a decode failure must not fail navigation — ImageById renders its own pending box, and a broken image is a display concern rather than a routing one
  });
};
```

`ensureQueryData` alone is not sufficient. It resolves the image's *url*, produced by `getImageUrl` through `convertFileSrc`; the browser still fetches and decodes the bytes at that url when `<img>` mounts. `decode()` is what makes the difference between a url in the cache and a bitmap ready to paint.

The nullable `imageId` parameter is intentional: entity image columns are nullable, and every caller would otherwise repeat the same guard. Placement in `data-access-layer/images/` follows the layer's ownership of image query concerns; it is a plain async function rather than a hook because its only callers are route loaders, which cannot call hooks.

Barrel exports are explicit named exports at both levels.

## Frontend

### Loader contract

As in SF4, loaders warm the cache and return nothing; screens continue reading through their existing hooks. Entities split into two shapes by whether they carry an image.

### Reference implementation — entity with an image

`app/src/routes/adventure.$adventureId.foe.$foeId.tsx`:

```ts
import { createFileRoute } from '@tanstack/react-router';
import { FoeScreen } from '@/screens';
import { foeQueryOptions, ensureImagePainted } from '@/data-access-layer';

export const Route = createFileRoute('/adventure/$adventureId/foe/$foeId')({
  component: FoeScreen,
  loader: async ({ context, params }) => {
    const foe = await context.queryClient.ensureQueryData(
      foeQueryOptions(params.foeId),
    );
    await ensureImagePainted(context.queryClient, foe.image_id ?? null);
  },
});
```

The two awaits are sequential, unlike SF4's `Promise.all`: the image id is a field on the entity, so the image query cannot start until the entity resolves. This is a genuine dependency, not an oversight.

### Reference implementation — entity without an image

`app/src/routes/adventure.$adventureId.session.$sessionId.tsx` has two queries and no image:

```ts
loader: async ({ context, params }) => {
  await Promise.all([
    context.queryClient.ensureQueryData(sessionQueryOptions(params.sessionId)),
    context.queryClient.ensureQueryData(
      sessionStepListQueryOptions(params.sessionId),
    ),
  ]);
},
```

`SessionScreen` calls both `useSession` and `useSessionSteps`; awaiting only the session leaves the steps query pending and the spinner still appears. Both take the same `sessionId` and are independent of each other, so they run concurrently.

### Substitution table

| Route file | Screen | Entity factory | Image |
| --- | --- | --- | --- |
| `adventure.$adventureId.index.tsx` | `AdventureScreen` | `adventureQueryOptions(params.adventureId)` | yes |
| `adventure.$adventureId.faction.$factionId.tsx` | `FactionScreen` | `factionQueryOptions(params.factionId)` | yes |
| `adventure.$adventureId.foe.$foeId.tsx` | `FoeScreen` | `foeQueryOptions(params.foeId)` | yes — reference |
| `adventure.$adventureId.item.$itemId.tsx` | `ItemScreen` | `itemQueryOptions(params.itemId)` | yes |
| `adventure.$adventureId.location.$locationId.tsx` | `LocationScreen` | `locationQueryOptions(params.locationId)` | yes |
| `adventure.$adventureId.npc.$npcId.tsx` | `NpcScreen` | `npcQueryOptions(params.npcId)` | yes |
| `adventure.$adventureId.pc.$pcId.tsx` | `PcScreen` | `pcQueryOptions(params.pcId)` | yes |
| `adventure.$adventureId.encounter.$encounterId.tsx` | `EncounterScreen` | `encounterQueryOptions(params.encounterId)` | no |
| `adventure.$adventureId.session.$sessionId.tsx` | `SessionScreen` | `sessionQueryOptions(params.sessionId)` + `sessionStepListQueryOptions(params.sessionId)` | no — reference for the two-query shape |

Encounters and Sessions carry no `image_id` column and must not call `ensureImagePainted`. Every other row follows the image reference, reading `image_id` off the resolved entity.

## Verification

`npx tsc --noEmit`, `npx eslint .`, and `prettier --check .` from `app/`.

Behavioral check under `npm run dev`, which is the only way to exercise any of this:

- From each entity list, click a row and confirm the detail screen arrives with its name, editors, and image already painted — no spinner frame, no image appearing after the text.
- `[MANUAL-VERIFY]` Navigate directly between two detail screens of the same type and watch the transition. Whether the outgoing route stays painted while the incoming loader resolves is not documented by TanStack Router. If the viewport goes blank between the two, the layout jump has moved rather than been removed; surface it rather than adding a `pendingComponent`, which the root spec excludes.
