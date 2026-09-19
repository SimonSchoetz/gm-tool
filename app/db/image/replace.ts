import { create } from './create';
import { remove } from './remove';
import type { CreateImageInput } from './types';

export const replace = async (
  oldId: string,
  data: CreateImageInput,
): Promise<string> => {
  const newId = await create(data);
  await remove(oldId);
  return newId;
};
