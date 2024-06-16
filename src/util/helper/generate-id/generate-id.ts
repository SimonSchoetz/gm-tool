import { nanoid } from 'nanoid';

// TODO: learn how to properly mock nanoid for jest testing and implement tests
export const generateId = (): string => {
  return nanoid();
};
