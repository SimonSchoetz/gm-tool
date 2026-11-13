import * as encounterDb from '@db/encounter';
import type { Encounter, UpdateEncounterInput } from '@db/encounter';
import * as imageService from '@services/imageService';
import * as encounterQueueService from '@services/encounterQueueService';
import { writeChildrenOrRemoveParent } from '@services/partialCopy';
import {
  encounterNotFoundError,
  encounterLoadError,
  encounterCreateError,
  encounterUpdateError,
  encounterDeleteError,
  encounterDuplicateError,
} from '@domain/encounters';

export type UpdateEncounterData = UpdateEncounterInput & {
  imgFilePath?: string;
};

export const getAllEncounters = async (
  adventureId: string,
): Promise<Encounter[]> => {
  try {
    return await encounterDb.getAll(adventureId);
  } catch (err) {
    throw encounterLoadError(err);
  }
};

export const getEncounterById = async (id: string): Promise<Encounter> => {
  let encounter: Encounter | null;
  try {
    encounter = await encounterDb.get(id);
  } catch (err) {
    throw encounterLoadError(err);
  }

  if (!encounter) {
    throw encounterNotFoundError(id);
  }

  return encounter;
};

export const createEncounter = async (adventureId: string): Promise<string> => {
  try {
    return await encounterDb.create(adventureId);
  } catch (err) {
    throw encounterCreateError(err);
  }
};

export const updateEncounter = async (
  id: string,
  data: UpdateEncounterData,
): Promise<void> => {
  try {
    const imageId = data.imgFilePath
      ? await imageService.saveImage(data.image_id ?? null, data.imgFilePath)
      : null;

    const { imgFilePath: _imgFilePath, ...dto } = data;
    if (imageId) {
      dto.image_id = imageId;
    }

    await encounterDb.update(id, dto);
  } catch (err) {
    throw encounterUpdateError(id, err);
  }
};

export const removeEncounterImage = async (id: string): Promise<void> => {
  try {
    const encounter = await getEncounterById(id);
    if (!encounter.image_id) return;
    await imageService.deleteImage(encounter.image_id);
    await encounterDb.update(id, { image_id: null });
  } catch (err) {
    throw encounterUpdateError(id, err);
  }
};

export const deleteEncounter = async (id: string): Promise<void> => {
  try {
    const encounter = await getEncounterById(id);

    if (encounter.image_id) {
      await imageService.deleteImage(encounter.image_id);
    }

    await encounterDb.remove(id);
  } catch (err) {
    throw encounterDeleteError(id, err);
  }
};

export const duplicateEncounter = async (id: string): Promise<string> => {
  try {
    const source = await getEncounterById(id);
    const imageId = source.image_id
      ? await imageService.duplicateImage(source.image_id)
      : null;
    const newId = await encounterDb.duplicate(id, imageId);
    await writeChildrenOrRemoveParent(
      () => encounterQueueService.duplicateQueue(id, newId),
      () => encounterDb.remove(newId),
    );
    return newId;
  } catch (err) {
    throw encounterDuplicateError(id, err);
  }
};
