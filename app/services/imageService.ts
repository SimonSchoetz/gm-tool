import { invoke, convertFileSrc } from '@tauri-apps/api/core';
import * as imageDb from '@db/image';
import type { Image } from '@db/image';

export const createImage = async (filePath: string): Promise<string> =>
  imageDb.create({ filePath });

export const deleteImage = async (id: string): Promise<void> => {
  await imageDb.remove(id);
};

export const replaceImage = async (oldId: string, filePath: string): Promise<string> =>
  imageDb.replace(oldId, { filePath });

export const getImageById = async (id: string): Promise<Image> => {
  const img = await imageDb.get(id);
  if (!img) throw new Error(`Image not found: ${id}`);
  return img;
};

export const getImageUrl = async (id: string, extension: string): Promise<string> => {
  const path = await invoke<string>('get_image_url', { id, extension });
  return convertFileSrc(path);
};
