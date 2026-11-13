import { invoke, convertFileSrc } from '@platform';
import * as imageDb from '@db/image';
import * as systemDb from '@db/_system';
import { isImageReferenced } from '@db/image-references';
import type { Image } from '@db/image';
import {
  imageNotFoundError,
  imageLoadError,
  imageCreateError,
  imageDuplicateError,
  imageUrlLoadError,
  imageUpdateFrameError,
} from '@domain';

const createImage = async (filePath: string, id: string): Promise<void> => {
  try {
    await imageDb.create({ filePath }, id);
  } catch (cause) {
    throw imageCreateError(cause);
  }
};

const copyImage = async (sourceId: string, id: string): Promise<void> => {
  try {
    await imageDb.duplicate(sourceId, id);
  } catch (cause) {
    throw imageDuplicateError(sourceId, cause);
  }
};

// Removes each image no entity names any more and then forgets it; an image an entity names is only forgotten. An image whose removal fails stays recorded, so the next start tries again. Never rejects: by now the entity holds the change the user made, and an image nothing names is invisible.
const settleImages = async (ids: string[]): Promise<void> => {
  for (const id of ids) {
    try {
      if (!(await isImageReferenced(id))) {
        await imageDb.remove(id);
      }
      await systemDb.removePendingImageIds([id]);
    } catch {
      // Swallowed on purpose: see the comment above.
    }
  }
};

// Records every image a flow touches, new and old, before the flow's first write, and settles them when it ends, failed or not. A quit part-way leaves them recorded in the local, unsynced `_system` row, and cleanUpAbandonedImages settles them at the next start. Only images this device's own flows recorded are ever removed this way: an image that arrived from a paired device and is not yet named by the entity that will name it, because that entity's change is still to come in a later sync batch, is never touched.
const withImagesSettled = async <T>(
  imageIds: string[],
  flow: () => Promise<T>,
): Promise<T> => {
  await systemDb.addPendingImageIds(imageIds);
  try {
    return await flow();
  } finally {
    await settleImages(imageIds);
  }
};

// Stores the new image and points the entity at it before the image it replaces is removed, so a failure or a quit at any step leaves the entity showing one of the two images, never none.
export const saveImage = (
  currentImageId: string | null,
  filePath: string,
  pointEntityAt: (imageId: string) => Promise<void>,
): Promise<void> => {
  const newImageId = imageDb.generateImageId();
  return withImagesSettled(
    currentImageId === null ? [newImageId] : [newImageId, currentImageId],
    async () => {
      await createImage(filePath, newImageId);
      await pointEntityAt(newImageId);
    },
  );
};

// Empties the entity's image before the image is removed, so a failure or a quit leaves the entity either showing its image or showing none, never naming a deleted one.
export const removeImage = (
  imageId: string,
  detachFromEntity: () => Promise<void>,
): Promise<void> => withImagesSettled([imageId], detachFromEntity);

// Deletes the entity first and its images after it, so a failure or a quit never leaves the entity with its images gone.
export const deleteWithImages = (
  imageIds: string[],
  deleteEntity: () => Promise<void>,
): Promise<void> => withImagesSettled(imageIds, deleteEntity);

// Copies the source's image, when it has one, for the copy of the entity that `duplicateEntity` writes with that image's id; an image copy no entity names after a failure is removed with the others this file settles.
export const duplicateWithImage = async (
  sourceImageId: string | null,
  duplicateEntity: (imageId: string | null) => Promise<string>,
): Promise<string> => {
  if (sourceImageId === null) {
    return duplicateEntity(null);
  }
  const newImageId = imageDb.generateImageId();
  return withImagesSettled([newImageId], async () => {
    await copyImage(sourceImageId, newImageId);
    return duplicateEntity(newImageId);
  });
};

// Settles the images that a flow of this device recorded and never settled, because the app quit part-way or the settling failed. Never rejects: a failure leaves the ids recorded for the next start and must not keep the app from starting.
export const cleanUpAbandonedImages = async (): Promise<void> => {
  try {
    await settleImages(await systemDb.getPendingImageIds());
  } catch {
    // Swallowed on purpose: see the comment above.
  }
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
