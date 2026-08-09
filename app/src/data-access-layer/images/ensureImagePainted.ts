import type { QueryClient } from '@tanstack/react-query';
import { imageQueryOptions } from './imageQueryOptions';

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
