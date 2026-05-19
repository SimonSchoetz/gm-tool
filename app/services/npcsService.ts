import * as npcDb from '@db/npc';
import * as imageService from '@services/imageService';
import type { Npc, UpdateNpcInput } from '@db/npc';
import {
  npcNotFoundError,
  npcLoadError,
  npcCreateError,
  npcUpdateError,
  npcDeleteError,
} from '@domain/npcs';

export type UpdateNpcData = UpdateNpcInput & {
  imgFilePath?: string;
};

export const getAllNpcs = async (adventureId: string): Promise<Npc[]> => {
  try {
    return await npcDb.getAll(adventureId);
  } catch (err) {
    throw npcLoadError(err);
  }
};

export const getNpcById = async (id: string): Promise<Npc> => {
  const npc = await npcDb.get(id);

  if (!npc) {
    throw npcNotFoundError(id);
  }

  return npc;
};

export const createNpc = async (adventureId: string): Promise<string> => {
  try {
    return await npcDb.create(adventureId);
  } catch (err) {
    throw npcCreateError(err);
  }
};

export const updateNpc = async (
  id: string,
  data: UpdateNpcData,
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

    await npcDb.update(id, dto);
  } catch (err) {
    throw npcUpdateError(id, err);
  }
};

export const removeNpcImage = async (npcId: string): Promise<void> => {
  const npc = await getNpcById(npcId);
  if (!npc.image_id) return;
  try {
    await imageService.deleteImage(npc.image_id);
    await npcDb.update(npcId, { image_id: null });
  } catch (err) {
    throw npcUpdateError(npcId, err);
  }
};

export const deleteNpc = async (
  id: string,
  npc: Npc | null = null,
): Promise<void> => {
  try {
    const npcToDelete = npc ?? (await getNpcById(id));

    if (npcToDelete.image_id) {
      await imageService.deleteImage(npcToDelete.image_id);
    }

    await npcDb.remove(id);
  } catch (err) {
    throw npcDeleteError(id, err);
  }
};
