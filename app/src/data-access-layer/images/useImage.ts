import { useQuery } from '@tanstack/react-query';
import * as imageService from '@/services/imageService';
import { imageKeys } from './imageKeys';

type UseImageReturn = {
  imageUrl: string | null;
  loading: boolean;
};

export const useImage = (imageId: string | null): UseImageReturn => {
  const { data: imageUrl = null, isPending: loading } = useQuery({
    queryKey: imageKeys.detail(imageId ?? ''),
    queryFn: async () => {
      if (imageId === null) return null;
      const image = await imageService.getImageById(imageId);
      return imageService.getImageUrl(image.id, image.file_extension);
    },
    enabled: imageId !== null,
    throwOnError: true,
  });

  return { imageUrl, loading };
};
