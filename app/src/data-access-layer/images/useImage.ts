import { useQuery } from '@tanstack/react-query';
import { imageQueryOptions } from './imageQueryOptions';
import type { ImageFrame } from './useUpdateImageFrame';

type UseImageReturn = {
  imageUrl: string | null;
  frame: ImageFrame | null;
  loading: boolean;
};

export const useImage = (imageId: string | null): UseImageReturn => {
  const { data = null, isPending: loading } = useQuery({
    ...imageQueryOptions(imageId ?? ''),
    enabled: imageId !== null,
  });

  return {
    imageUrl: data?.url ?? null,
    frame: data?.frame ?? null,
    loading,
  };
};
