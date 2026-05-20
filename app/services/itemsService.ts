import * as itemDb from '@db/item';
import * as imageService from '@services/imageService';
import type { Item, UpdateItemInput } from '@db/item';
import {
  itemNotFoundError,
  itemLoadError,
  itemCreateError,
  itemUpdateError,
  itemDeleteError,
} from '@domain/items';

export type UpdateItemData = UpdateItemInput & {
  imgFilePath?: string;
};

export const getAllItems = async (adventureId: string): Promise<Item[]> => {
  try {
    return await itemDb.getAll(adventureId);
  } catch (err) {
    throw itemLoadError(err);
  }
};

export const getItemById = async (id: string): Promise<Item> => {
  let item: Item | null;
  try {
    item = await itemDb.get(id);
  } catch (err) {
    throw itemLoadError(err);
  }

  if (!item) {
    throw itemNotFoundError(id);
  }

  return item;
};

export const createItem = async (adventureId: string): Promise<string> => {
  try {
    return await itemDb.create(adventureId);
  } catch (err) {
    throw itemCreateError(err);
  }
};

export const updateItem = async (
  id: string,
  data: UpdateItemData,
): Promise<void> => {
  try {
    let imageId: string | null = null;

    if (data.imgFilePath && data.image_id) {
      imageId = await imageService.replaceImage(
        data.image_id,
        data.imgFilePath,
      );
    }

    if (data.imgFilePath && !data.image_id) {
      imageId = await imageService.createImage(data.imgFilePath);
    }

    const { imgFilePath: _imgFilePath, ...dto } = data;
    if (imageId) {
      dto.image_id = imageId;
    }

    await itemDb.update(id, dto);
  } catch (err) {
    throw itemUpdateError(id, err);
  }
};

export const removeItemImage = async (itemId: string): Promise<void> => {
  const item = await getItemById(itemId);
  if (!item.image_id) return;
  try {
    await imageService.deleteImage(item.image_id);
    await itemDb.update(itemId, { image_id: null });
  } catch (err) {
    throw itemUpdateError(itemId, err);
  }
};

export const deleteItem = async (
  id: string,
  item: Item | null = null,
): Promise<void> => {
  try {
    const itemToDelete = item ?? (await getItemById(id));

    if (itemToDelete.image_id) {
      await imageService.deleteImage(itemToDelete.image_id);
    }

    await itemDb.remove(id);
  } catch (err) {
    throw itemDeleteError(id, err);
  }
};
