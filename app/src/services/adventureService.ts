import * as adventureDb from '@db/adventure';
import * as imageService from '@/services/imageService';
import type {
  Adventure,
  CreateAdventureInput,
  UpdateAdventureInput,
} from '@db/adventure';
import {
  adventureNotFoundError,
  adventureLoadError,
  adventureCreateError,
  adventureUpdateError,
  adventureDeleteError,
} from '@/domain/adventures';
import { getDateTimeString } from '@/util';

export type UpdateAdventureData = UpdateAdventureInput & {
  imgFilePath?: string;
};

export const getAllAdventures = async (): Promise<Adventure[]> => {
  try {
    const result = await adventureDb.getAll();
    return result.data;
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
    const dto: CreateAdventureInput = {
      name: `New adventure $${getDateTimeString(new Date().toISOString())}`,
    };

    return await adventureDb.create(dto);
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

    const { imgFilePath, ...dto } = data;
    if (imageId) {
      dto.image_id = imageId;
    }

    await adventureDb.update(id, dto);
  } catch (err) {
    throw adventureUpdateError(id, err);
  }
};

export const deleteAdventure = async (
  id: string,
  adventure?: Adventure,
): Promise<void> => {
  /**
   * TODO: Needs to delete all corresponding sessions ect. in the future
   */
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
