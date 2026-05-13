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
