import { invoke, convertFileSrc } from '@platform';
import * as imageDb from '@db/image';
import type { Image } from '@db/image';
import {
  imageNotFoundError,
  imageLoadError,
  imageCreateError,
  imageDuplicateError,
  imageUrlLoadError,
  imageUpdateFrameError,
} from '@domain';

const createImage = async (filePath: string): Promise<string> => {
  try {
    return await imageDb.create({ filePath });
  } catch (cause) {
    throw imageCreateError(cause);
  }
};

export const duplicateImage = async (sourceId: string): Promise<string> => {
  try {
    return await imageDb.duplicate(sourceId);
  } catch (cause) {
    throw imageDuplicateError(sourceId, cause);
  }
};

// Runs after no entity points at the images any more, so a failure leaves only image rows nothing shows, which the startup cleanup removes; failing the flow for it would report as failed a change the user's entity already holds. Each image is tried on its own, so one failure leaves the others' removal unaffected.
export const discardImages = async (ids: string[]): Promise<void> => {
  for (const id of ids) {
    try {
      await imageDb.remove(id);
    } catch {
      // Swallowed on purpose: see the comment above.
    }
  }
};

// Stores the new image and points the entity at it before the image it replaces is removed, so a failure or a quit at any step leaves the entity showing one of the two images, never none.
export const saveImage = async (
  currentImageId: string | null,
  filePath: string,
  pointEntityAt: (imageId: string) => Promise<void>,
): Promise<void> => {
  const newImageId = await createImage(filePath);
  await pointEntityAt(newImageId);
  if (currentImageId !== null) {
    await discardImages([currentImageId]);
  }
};

// Empties the entity's image before the image is removed, so a failure or a quit leaves the entity either showing its image or showing none, never naming a deleted one.
export const removeImage = async (
  imageId: string,
  detachFromEntity: () => Promise<void>,
): Promise<void> => {
  await detachFromEntity();
  await discardImages([imageId]);
};

export const getImageById = async (id: string): Promise<Image> => {
  let img: Image | null;
  try {
    img = await imageDb.get(id);
  } catch (cause) {
    throw imageLoadError(cause);
  }

  if (!img) {
    throw imageNotFoundError(id);
  }

  return img;
};

export const getImageUrl = async (
  id: string,
  extension: string,
): Promise<string> => {
  try {
    const path = await invoke<string>('get_image_url', { id, extension });
    return convertFileSrc(path);
  } catch (cause) {
    throw imageUrlLoadError(id, cause);
  }
};

export const updateImageFrame = async (
  id: string,
  frame: { x: number; y: number; zoom: number },
): Promise<void> => {
  try {
    await imageDb.update(id, {
      frame_x: frame.x,
      frame_y: frame.y,
      frame_zoom: frame.zoom,
    });
  } catch (cause) {
    throw imageUpdateFrameError(cause);
  }
};
