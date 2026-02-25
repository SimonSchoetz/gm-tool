import { useQuery } from '@tanstack/react-query';
import * as imageService from '@/services/imageService';
import { imageKeys } from './imageKeys';

type UseImageReturn = {
  imageUrl: string | null;
  loading: boolean;
};

export const useImage = (imageId: string | null | undefined): UseImageReturn => {
  const { data: imageUrl = null, isPending: loading } = useQuery({
    queryKey: imageKeys.detail(imageId ?? ''),
    queryFn: async () => {
      const image = await imageService.getImageById(imageId!);
      return imageService.getImageUrl(image.id, image.file_extension);
    },
    enabled: !!imageId,
    throwOnError: true,
  });

  return { imageUrl, loading };
};
