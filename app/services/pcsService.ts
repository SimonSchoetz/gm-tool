import * as pcDb from '@db/pc';
import * as imageService from '@services/imageService';
import type { Pc, UpdatePcInput } from '@db/pc';
import {
  pcNotFoundError,
  pcLoadError,
  pcCreateError,
  pcUpdateError,
  pcDeleteError,
} from '@domain/pcs';

export type UpdatePcData = UpdatePcInput & {
  imgFilePath?: string;
};

export const getAllPcs = async (adventureId: string): Promise<Pc[]> => {
  try {
    return await pcDb.getAll(adventureId);
  } catch (err) {
    throw pcLoadError(err);
  }
};

export const getPcById = async (id: string): Promise<Pc> => {
  let pc: Pc | null;
  try {
    pc = await pcDb.get(id);
  } catch (err) {
    throw pcLoadError(err);
  }

  if (!pc) {
    throw pcNotFoundError(id);
  }

  return pc;
};

export const createPc = async (adventureId: string): Promise<string> => {
  try {
    return await pcDb.create(adventureId);
  } catch (err) {
    throw pcCreateError(err);
  }
};

export const updatePc = async (
  id: string,
  data: UpdatePcData,
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

    await pcDb.update(id, dto);
  } catch (err) {
    throw pcUpdateError(id, err);
  }
};

export const removePcImage = async (pcId: string): Promise<void> => {
  const pc = await getPcById(pcId);
  if (!pc.image_id) return;
  try {
    await imageService.deleteImage(pc.image_id);
    await pcDb.update(pcId, { image_id: null });
  } catch (err) {
    throw pcUpdateError(pcId, err);
  }
};

export const deletePc = async (
  id: string,
  pc: Pc | null = null,
): Promise<void> => {
  try {
    const pcToDelete = pc ?? (await getPcById(id));

    if (pcToDelete.image_id) {
      await imageService.deleteImage(pcToDelete.image_id);
    }

    await pcDb.remove(id);
  } catch (err) {
    throw pcDeleteError(id, err);
  }
};
