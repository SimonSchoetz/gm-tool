import * as npcDb from '@db/npc';
import * as imageService from '@/services/imageService';
import type { Npc, CreateNpcInput, UpdateNpcInput } from '@db/npc';
import {
  NpcNotFoundError,
  NpcLoadError,
  NpcCreateError,
  NpcUpdateError,
  NpcDeleteError,
} from '@/domain/npcs';

export type UpdateNpcData = UpdateNpcInput & {
  imgFilePath?: string;
};

export const getAllNpcs = async (adventureId: string): Promise<Npc[]> => {
  try {
    return await npcDb.getAll(adventureId);
  } catch (err) {
    throw new NpcLoadError(err);
  }
};

export const getNpcById = async (id: string): Promise<Npc> => {
  const npc = await npcDb.get(id);

  if (!npc) {
    throw new NpcNotFoundError(id);
  }

  return npc;
};

export const createNpc = async (adventureId: string): Promise<string> => {
  try {
    const dto: CreateNpcInput = {
      adventure_id: adventureId,
      name: `New NPC ${new Date().toLocaleDateString()}`,
    };

    return await npcDb.create(dto);
  } catch (err) {
    throw new NpcCreateError(err);
  }
};

export const updateNpc = async (
  id: string,
  data: UpdateNpcData
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

    await npcDb.update(id, dto);
  } catch (err) {
    throw new NpcUpdateError(id, err);
  }
};

export const deleteNpc = async (id: string, npc?: Npc): Promise<void> => {
  try {
    const npcToDelete = npc ?? (await getNpcById(id));

    if (npcToDelete.image_id) {
      await imageService.deleteImage(npcToDelete.image_id);
    }

    await npcDb.remove(id);
  } catch (err) {
    throw new NpcDeleteError(id, err);
  }
};
