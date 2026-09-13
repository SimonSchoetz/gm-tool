import * as encounterDb from '@db/encounter';
import type { Encounter, UpdateEncounterInput } from '@db/encounter';
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
    await encounterDb.remove(id);
  } catch (err) {
    throw encounterDeleteError(id, err);
  }
};

export const duplicateEncounter = async (id: string): Promise<string> => {
  try {
    return await encounterDb.duplicate(id);
  } catch (err) {
    throw encounterDuplicateError(id, err);
  }
};
