# SF3 — DAL: useImage extension + useUpdateImageFrame

Extend `useImage` to return frame data alongside the image URL. Add `useUpdateImageFrame` hook and `ImageFrame` type. Update barrels.

## Files Affected

Modified:
- `app/src/data-access-layer/images/useImage.ts`
- `app/src/data-access-layer/images/index.ts`
- `app/src/data-access-layer/index.ts`

New:
- `app/src/data-access-layer/images/useUpdateImageFrame.ts`

## Data Access Layer

### `app/src/data-access-layer/images/useUpdateImageFrame.ts` (new)

Define `ImageFrame` here — it is the mutation variable type and is consumed by `useImage.ts` (sibling import) and `FramingOverlay` (external consumer via barrel).

```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as imageService from '@services/imageService';
import { imageKeys } from './imageKeys';

export type ImageFrame = {
  x: number;
  y: number;
  zoom: number;
};

type UseUpdateImageFrameReturn = {
  updateFrame: (frame: ImageFrame) => Promise<void>;
};

export const useUpdateImageFrame = (imageId: string): UseUpdateImageFrameReturn => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (frame: ImageFrame) => imageService.updateImageFrame(imageId, frame),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: imageKeys.detail(imageId) });
    },
  });

  return {
    updateFrame: (frame) => mutation.mutateAsync(frame),
  };
};
```

`imageId` is captured at construction time via the closure. `frame` is the mutation variable (the data being saved — it varies per call). [app/src/CLAUDE.md — Mutations close over construction-time arguments]

`invalidateQueries` causes `useImage` to refetch after a save, keeping the cache current. The `void` suppresses the floating promise from `invalidateQueries`.

### `app/src/data-access-layer/images/useImage.ts`

Replace the entire file. The `queryFn` now returns an object containing both the URL and the frame data. The return type gains `frame: ImageFrame | null`.

```ts
import { useQuery } from '@tanstack/react-query';
import * as imageService from '@services/imageService';
import { imageKeys } from './imageKeys';
import type { ImageFrame } from './useUpdateImageFrame';

type UseImageReturn = {
  imageUrl: string | null;
  frame: ImageFrame | null;
  loading: boolean;
};

export const useImage = (imageId: string | null): UseImageReturn => {
  const { data = null, isPending: loading } = useQuery({
    queryKey: imageKeys.detail(imageId ?? ''),
    queryFn: async () => {
      if (imageId === null) return null;
      const image = await imageService.getImageById(imageId);
      const url = await imageService.getImageUrl(image.id, image.file_extension);
      const frame: ImageFrame | null =
        typeof image.frame_x === 'number' &&
        typeof image.frame_y === 'number' &&
        typeof image.frame_zoom === 'number'
          ? { x: image.frame_x, y: image.frame_y, zoom: image.frame_zoom }
          : null;
      return { url, frame };
    },
    enabled: imageId !== null,
    throwOnError: true,
  });

  return {
    imageUrl: data?.url ?? null,
    frame: data?.frame ?? null,
    loading,
  };
};
```

`typeof === 'number'` guards handle both `null` and `undefined` from the DB schema's `.nullable().optional()` Zod type, producing `ImageFrame | null` in domain code. [app/CLAUDE.md — Never use undefined as a value in business logic]

`ImageById` continues to destructure only `{ imageUrl, loading }` from `useImage` — adding `frame` to the return type is backward-compatible. No change to `ImageById` required.

### `app/src/data-access-layer/images/index.ts`

Add explicit named exports for `useUpdateImageFrame` and `ImageFrame`:

```ts
export { useImage } from './useImage';
export { useImageMutations } from './useImageMutations';
export { imageKeys } from './imageKeys';
export { useUpdateImageFrame } from './useUpdateImageFrame';
export type { ImageFrame } from './useUpdateImageFrame';
```

### `app/src/data-access-layer/index.ts`

Add `useUpdateImageFrame` and `ImageFrame` to the images export line:

```ts
export {
  useImage,
  useImageMutations,
  imageKeys,
  useUpdateImageFrame,
} from './images';
export type { ImageFrame } from './images';
```

All other export lines in this file remain unchanged.
