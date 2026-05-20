import * as factionDb from '@db/faction';
import * as imageService from '@services/imageService';
import type { Faction, UpdateFactionInput } from '@db/faction';
import {
  factionNotFoundError,
  factionLoadError,
  factionCreateError,
  factionUpdateError,
  factionDeleteError,
} from '@domain/factions';

export type UpdateFactionData = UpdateFactionInput & {
  imgFilePath?: string;
};

export const getAllFactions = async (adventureId: string): Promise<Faction[]> => {
  try {
    return await factionDb.getAll(adventureId);
  } catch (err) {
    throw factionLoadError(err);
  }
};

export const getFactionById = async (id: string): Promise<Faction> => {
  const faction = await factionDb.get(id);

  if (!faction) {
    throw factionNotFoundError(id);
  }

  return faction;
};

export const createFaction = async (adventureId: string): Promise<string> => {
  try {
    return await factionDb.create(adventureId);
  } catch (err) {
    throw factionCreateError(err);
  }
};

export const updateFaction = async (
  id: string,
  data: UpdateFactionData,
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

    await factionDb.update(id, dto);
  } catch (err) {
    throw factionUpdateError(id, err);
  }
};

export const removeFactionImage = async (factionId: string): Promise<void> => {
  const faction = await getFactionById(factionId);
  if (!faction.image_id) return;
  try {
    await imageService.deleteImage(faction.image_id);
    await factionDb.update(factionId, { image_id: null });
  } catch (err) {
    throw factionUpdateError(factionId, err);
  }
};

export const deleteFaction = async (
  id: string,
  faction: Faction | null = null,
): Promise<void> => {
  try {
    const factionToDelete = faction ?? (await getFactionById(id));

    if (factionToDelete.image_id) {
      await imageService.deleteImage(factionToDelete.image_id);
    }

    await factionDb.remove(id);
  } catch (err) {
    throw factionDeleteError(id, err);
  }
};
