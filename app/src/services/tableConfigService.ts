import * as tableConfigDb from '@db/table-config';
import type {
  TableConfig,
  UpdateTableConfigInput,
} from '@db/table-config';
import {
  tableConfigNotFoundError,
  tableConfigLoadError,
  tableConfigUpdateError,
} from '@/domain/table-config';

export const getAllTableConfigs = async (): Promise<TableConfig[]> => {
  try {
    return await tableConfigDb.getAll();
  } catch (err) {
    throw tableConfigLoadError(err);
  }
};

export const getTableConfigById = async (id: string): Promise<TableConfig> => {
  const config = await tableConfigDb.get(id);

  if (!config) {
    throw tableConfigNotFoundError(id);
  }

  return config;
};

export const updateTableConfig = async (
  id: string,
  data: UpdateTableConfigInput
): Promise<void> => {
  try {
    await tableConfigDb.update(id, data);
  } catch (err) {
    throw tableConfigUpdateError(id, err);
  }
};
