import * as tableConfigDb from '@db/table-config';
import type {
  TableConfig,
  UpdateTableConfigInput,
} from '@db/table-config';
import {
  TableConfigNotFoundError,
  TableConfigLoadError,
  TableConfigUpdateError,
} from '@/domain/table-config';

export const getAllTableConfigs = async (): Promise<TableConfig[]> => {
  try {
    return await tableConfigDb.getAll();
  } catch (err) {
    throw new TableConfigLoadError(err);
  }
};

export const getTableConfigById = async (id: string): Promise<TableConfig> => {
  const config = await tableConfigDb.get(id);

  if (!config) {
    throw new TableConfigNotFoundError(id);
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
    throw new TableConfigUpdateError(id, err);
  }
};
