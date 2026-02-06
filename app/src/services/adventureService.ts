import * as adventureDb from '@db/adventure';
import * as imageDb from '@db/image';
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
} from '@/providers/adventures/errors';

export type UpdateAdventureData = UpdateAdventureInput & {
  imgFilePath?: string;
};

export const loadAllAdventures = async (): Promise<Adventure[]> => {
  try {
    const result = await adventureDb.getAll();
    return result.data;
  } catch (err) {
    throw new AdventureLoadError(err);
  }
};

export const loadAdventureById = async (
  id: string,
  adventures?: Adventure[],
): Promise<Adventure> => {
  const adventureList = adventures?.length
    ? adventures
    : await loadAllAdventures();

  const foundAdventure = adventureList.find((adv) => adv.id === id);

  if (!foundAdventure) {
    throw new AdventureNotFoundError(id);
  }

  return foundAdventure;
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
      imageId = await imageDb.replace(data.image_id, {
        filePath: data.imgFilePath,
      });
    }

    if (data.imgFilePath && !data.image_id) {
      imageId = await imageDb.create({ filePath: data.imgFilePath });
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
  try {
    const adventureToDelete = adventure ?? (await loadAdventureById(id));

    if (adventureToDelete.image_id) {
      await imageDb.remove(adventureToDelete.image_id);
    }

    await adventureDb.remove(id);
  } catch (err) {
    throw new AdventureDeleteError(id, err);
  }
};
