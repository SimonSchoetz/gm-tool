import { create } from './create';
import { remove } from './remove';
import type { CreateImageInput } from './types';

export const replace = async (
  oldId: string,
  data: CreateImageInput
): Promise<string> => {
  await remove(oldId);
  const newId = await create(data);
  return newId;
};
