# SF2 — Service: updateImageFrame

Add `updateImageFrame` to `imageService.ts`.

## Files Affected

Modified:
- `app/services/imageService.ts`

## Services

### `app/services/imageService.ts`

Add one exported function after `getImageUrl`:

```ts
export const updateImageFrame = async (
  id: string,
  frame: { x: number; y: number; zoom: number },
): Promise<void> => {
  await imageDb.update(id, {
    frame_x: frame.x,
    frame_y: frame.y,
    frame_zoom: frame.zoom,
  });
};
```

`imageDb` is already imported as `import * as imageDb from '@db/image'`. The `update` function added in SF1 is accessible via this namespace import — no new import statement needed.

The domain-level `{ x, y, zoom }` shape maps to the DB-level `{ frame_x, frame_y, frame_zoom }` shape. Values are passed through as-is; no defaults or fallbacks are supplied. [app/services/CLAUDE.md — No fallback defaults for nullable columns]
