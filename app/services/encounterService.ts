import * as encounterDb from '@db/encounter';
import type { Encounter, UpdateEncounterInput } from '@db/encounter';
import * as imageService from '@services/imageService';
import * as encounterQueueService from '@services/encounterQueueService';
import {
  encounterNotFoundError,
  encounterLoadError,
  encounterCreateError,
  encounterUpdateError,
  encounterDeleteError,
  encounterDuplicateError,
} from '@domain/encounters';

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
  data: UpdateEncounterInput,
): Promise<void> => {
  try {
    await encounterDb.update(id, data);
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
    // No atomic multi-call write exists on this platform: a failed queue copy leaves the new encounter and a part of its queue behind.
    await encounterQueueService.duplicateQueue(id, newId);
    return newId;
  } catch (err) {
    throw encounterDuplicateError(id, err);
  }
};
