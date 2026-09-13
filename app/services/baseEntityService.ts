import * as baseEntityDb from '@db/base-entity';
import * as imageService from '@services/imageService';
import type { BaseEntity, UpdateBaseEntityInput } from '@db/base-entity';
import type { BaseEntityType } from '@domain/entities';
import {
  baseEntityNotFoundError,
  baseEntityLoadError,
  baseEntityCreateError,
  baseEntityUpdateError,
  baseEntityDeleteError,
  baseEntityDuplicateError,
} from '@domain/base-entities';

export type UpdateBaseEntityData = UpdateBaseEntityInput & {
  imgFilePath?: string;
};

export const getAllBaseEntities = async (
  entityType: BaseEntityType,
  adventureId: string,
): Promise<BaseEntity[]> => {
  try {
    return await baseEntityDb.getAll(entityType, adventureId);
  } catch (err) {
    throw baseEntityLoadError(entityType, err);
  }
};

export const getBaseEntityById = async (
  entityType: BaseEntityType,
  id: string,
): Promise<BaseEntity> => {
  let baseEntity: BaseEntity | null;
  try {
    baseEntity = await baseEntityDb.get(entityType, id);
  } catch (err) {
    throw baseEntityLoadError(entityType, err);
  }

  if (!baseEntity) {
    throw baseEntityNotFoundError(entityType, id);
  }

  return baseEntity;
};

export const createBaseEntity = async (
  entityType: BaseEntityType,
  adventureId: string,
): Promise<string> => {
  try {
    return await baseEntityDb.create(entityType, adventureId);
  } catch (err) {
    throw baseEntityCreateError(entityType, err);
  }
};

export const updateBaseEntity = async (
  entityType: BaseEntityType,
  id: string,
  data: UpdateBaseEntityData,
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

    await baseEntityDb.update(id, dto);
  } catch (err) {
    throw baseEntityUpdateError(entityType, id, err);
  }
};

export const removeBaseEntityImage = async (
  entityType: BaseEntityType,
  id: string,
): Promise<void> => {
  const baseEntity = await getBaseEntityById(entityType, id);
  if (!baseEntity.image_id) return;
  try {
    await imageService.deleteImage(baseEntity.image_id);
    await baseEntityDb.update(id, { image_id: null });
  } catch (err) {
    throw baseEntityUpdateError(entityType, id, err);
  }
};

export const deleteBaseEntity = async (
  entityType: BaseEntityType,
  id: string,
): Promise<void> => {
  try {
    const baseEntity = await getBaseEntityById(entityType, id);

    if (baseEntity.image_id) {
      await imageService.deleteImage(baseEntity.image_id);
    }

    await baseEntityDb.remove(id);
  } catch (err) {
    throw baseEntityDeleteError(entityType, id, err);
  }
};

export const duplicateBaseEntity = async (
  entityType: BaseEntityType,
  id: string,
): Promise<string> => {
  try {
    const source = await getBaseEntityById(entityType, id);
    const imageId = source.image_id
      ? await imageService.duplicateImage(source.image_id)
      : null;
    return await baseEntityDb.duplicate(entityType, id, imageId);
  } catch (err) {
    throw baseEntityDuplicateError(entityType, id, err);
  }
};
