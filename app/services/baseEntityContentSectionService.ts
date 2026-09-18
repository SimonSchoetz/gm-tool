import * as baseEntityContentSectionDb from '@db/base-entity-content-section';
import type {
  BaseEntityContentSection,
  UpdateBaseEntityContentSectionInput,
} from '@db/base-entity-content-section';
import {
  baseEntityContentSectionLoadError,
  baseEntityContentSectionCreateError,
  baseEntityContentSectionUpdateError,
  baseEntityContentSectionDeleteError,
  baseEntityContentSectionReorderError,
  type BaseEntityContentSectionType,
} from '@domain';

export const getSectionsByBaseEntityId = async (
  baseEntityId: string,
): Promise<BaseEntityContentSection[]> => {
  try {
    return await baseEntityContentSectionDb.getAllByBaseEntity(baseEntityId);
  } catch (err) {
    throw baseEntityContentSectionLoadError(err);
  }
};

export const createSection = async (
  baseEntityId: string,
  type: BaseEntityContentSectionType,
  name?: string,
): Promise<string> => {
  try {
    const sections =
      await baseEntityContentSectionDb.getAllByBaseEntity(baseEntityId);
    const maxSortOrder =
      sections.length > 0 ? Math.max(...sections.map((s) => s.sort_order)) : -1;
    return await baseEntityContentSectionDb.create({
      base_entity_id: baseEntityId,
      type,
      sort_order: maxSortOrder + 1,
      ...(name !== undefined ? { name } : {}),
    });
  } catch (err) {
    throw baseEntityContentSectionCreateError(err);
  }
};

export const updateSection = async (
  id: string,
  data: UpdateBaseEntityContentSectionInput,
): Promise<void> => {
  try {
    await baseEntityContentSectionDb.update(id, data);
  } catch (err) {
    throw baseEntityContentSectionUpdateError(id, err);
  }
};

export const deleteSection = async (id: string): Promise<void> => {
  try {
    await baseEntityContentSectionDb.remove(id);
  } catch (err) {
    throw baseEntityContentSectionDeleteError(id, err);
  }
};

export const bulkReorderSections = async (
  orderedSectionIds: string[],
): Promise<void> => {
  try {
    for (let index = 0; index < orderedSectionIds.length; index++) {
      await baseEntityContentSectionDb.update(orderedSectionIds[index], {
        sort_order: index,
      });
    }
  } catch (err) {
    throw baseEntityContentSectionReorderError(err);
  }
};
