import * as adventureDb from '@db/adventure';
import * as baseEntityDb from '@db/base-entity';
import * as encounterDb from '@db/encounter';
import * as imageService from '@services/imageService';
import type { Adventure, UpdateAdventureInput } from '@db/adventure';
import {
  adventureNotFoundError,
  adventureLoadError,
  adventureCreateError,
  adventureUpdateError,
  adventureDeleteError,
} from '@domain/adventures';
import { BASE_ENTITY_TYPES } from '@domain';

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
    const imageId = data.imgFilePath
      ? await imageService.saveImage(data.image_id ?? null, data.imgFilePath)
      : null;

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

    // The images are deleted before the row because the cascade removes the base entities and encounters, and with them the ids that name their images.
    const baseEntityImageIds = (
      await Promise.all(
        BASE_ENTITY_TYPES.map((entityType) =>
          baseEntityDb.getAll(entityType, id),
        ),
      )
    )
      .flat()
      .map((baseEntity) => baseEntity.image_id);
    const encounterImageIds = (await encounterDb.getAll(id)).map(
      (encounter) => encounter.image_id,
    );

    for (const imageId of [
      ...baseEntityImageIds,
      ...encounterImageIds,
      adventureToDelete.image_id,
    ]) {
      if (imageId) {
        await imageService.deleteImage(imageId);
      }
    }

    await adventureDb.remove(id);
  } catch (err) {
    throw adventureDeleteError(id, err);
  }
};
