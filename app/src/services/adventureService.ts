import * as adventureDb from '@db/adventure';
import * as imageService from '@/services/imageService';
import type {
  Adventure,
  CreateAdventureInput,
  UpdateAdventureInput,
} from '@db/adventure';
import {
  AdventureNotFoundError,
  AdventureLoadError,
  AdventureCreateError,
  AdventureUpdateError,
  AdventureDeleteError,
} from '@/domain/adventures';

export type UpdateAdventureData = UpdateAdventureInput & {
  imgFilePath?: string;
};

export const getAllAdventures = async (): Promise<Adventure[]> => {
  try {
    const result = await adventureDb.getAll();
    return result.data;
  } catch (err) {
    throw new AdventureLoadError(err);
  }
};

export const getAdventureById = async (id: string): Promise<Adventure> => {
  const adventure = await adventureDb.get(id);

  if (!adventure) {
    throw new AdventureNotFoundError(id);
  }

  return adventure;
};

export const createAdventure = async (): Promise<string> => {
  try {
    const dto: CreateAdventureInput = {
      title: `New adventure ${new Date().toLocaleDateString()}`,
    };

    return await adventureDb.create(dto);
  } catch (err) {
    throw new AdventureCreateError(err);
  }
};

export const updateAdventure = async (
  id: string,
  data: UpdateAdventureData,
): Promise<void> => {
  try {
    let imageId: string | null = null;

    if (data.imgFilePath && data.image_id) {
      imageId = await imageService.replaceImage(data.image_id, data.imgFilePath);
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
    throw new AdventureUpdateError(id, err);
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
    throw new AdventureDeleteError(id, err);
  }
};
