import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import * as imageDb from '@db/image';
import type { Image } from '@db/image';
import {
  imageNotFoundError,
  imageLoadError,
  imageCreateError,
  imageDeleteError,
  imageReplaceError,
  imageDuplicateError,
  imageUrlLoadError,
  imageUpdateFrameError,
} from '@domain';

export const createImage = async (filePath: string): Promise<string> => {
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

export const deleteImage = async (id: string): Promise<void> => {
  try {
    await imageDb.remove(id);
  } catch (cause) {
    throw imageDeleteError(id, cause);
  }
};

export const replaceImage = async (
  oldId: string,
  filePath: string,
): Promise<string> => {
  try {
    return await imageDb.replace(oldId, { filePath });
  } catch (cause) {
    throw imageReplaceError(oldId, cause);
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
