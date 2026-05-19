import * as adventureDb from '@db/adventure';
import * as imageService from '@services/imageService';
import type { Adventure, UpdateAdventureInput } from '@db/adventure';
import {
  adventureNotFoundError,
  adventureLoadError,
  adventureCreateError,
  adventureUpdateError,
  adventureDeleteError,
} from '@domain/adventures';

export type UpdateAdventureData = UpdateAdventureInput & {
  imgFilePath?: string;
};

export const getAllAdventures = async (): Promise<Adventure[]> => {
  try {
    return await adventureDb.getAll();
  } catch (err) {
    throw adventureLoadError(err);
  }
};

export const getAdventureById = async (id: string): Promise<Adventure> => {
  const adventure = await adventureDb.get(id);

  if (!adventure) {
    throw adventureNotFoundError(id);
  }

  return adventure;
};

export const createAdventure = async (): Promise<string> => {
  try {
    return await adventureDb.create();
  } catch (err) {
    throw adventureCreateError(err);
  }
};

export const updateAdventure = async (
  id: string,
  data: UpdateAdventureData,
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

    await adventureDb.update(id, dto);
  } catch (err) {
    throw adventureUpdateError(id, err);
  }
};

export const removeAdventureImage = async (
  adventureId: string,
): Promise<void> => {
  try {
    const adventure = await getAdventureById(adventureId);
    if (!adventure.image_id) return;
    await imageService.deleteImage(adventure.image_id);
    await adventureDb.update(adventureId, { image_id: null });
  } catch (err) {
    throw adventureUpdateError(adventureId, err);
  }
};

export const deleteAdventure = async (
  id: string,
  adventure: Adventure | null = null,
): Promise<void> => {
  try {
    const adventureToDelete = adventure ?? (await getAdventureById(id));

    if (adventureToDelete.image_id) {
      await imageService.deleteImage(adventureToDelete.image_id);
    }

    await adventureDb.remove(id);
  } catch (err) {
    throw adventureDeleteError(id, err);
  }
};
