import { queryOptions } from '@tanstack/react-query';
import * as imageService from '@services/imageService';
import { imageKeys } from './imageKeys';
import type { ImageFrame } from './useUpdateImageFrame';

export const imageQueryOptions = (imageId: string) =>
  queryOptions({
    queryKey: imageKeys.detail(imageId),
    queryFn: async () => {
      const image = await imageService.getImageById(imageId);
      const url = await imageService.getImageUrl(
        image.id,
        image.file_extension,
      );

      const frame = {
        x: image.frame_x,
        y: image.frame_y,
        zoom: image.frame_zoom,
      } as ImageFrame;
      const isFrame = assertIsFrame(frame);

      return { url, frame: isFrame ? frame : null };
    },
    throwOnError: true,
  });

const assertIsFrame = (frame: ImageFrame): frame is ImageFrame => {
  return (
    typeof frame.x === 'number' &&
    typeof frame.y === 'number' &&
    typeof frame.zoom === 'number'
  );
};
