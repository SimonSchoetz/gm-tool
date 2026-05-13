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
