import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as imageService from '@services/imageService';
import { imageKeys } from './imageKeys';
import { useAutosaveQueue } from '../useAutosaveQueue';

export type ImageFrame = {
  x: number;
  y: number;
  zoom: number;
};

type UseUpdateImageFrameReturn = {
  updateFrame: (frame: ImageFrame) => void;
};

export const useUpdateImageFrame = (
  imageId: string,
): UseUpdateImageFrameReturn => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, frame }: { id: string; frame: ImageFrame }) =>
      imageService.updateImageFrame(id, frame),
    onSuccess: (_result, { id }) => {
      void queryClient.invalidateQueries({
        queryKey: imageKeys.detail(id),
      });
    },
  });

  const saveQueue = useAutosaveQueue<ImageFrame>(
    (_pending, frame) => frame,
    (id, frame) => {
      mutation.mutate({ id, frame });
    },
  );

  return {
    updateFrame: (frame) => {
      saveQueue.schedule(imageId, frame);
    },
  };
};
