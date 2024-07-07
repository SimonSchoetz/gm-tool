import { SchemaName, parseDataWithZodSchema } from '@/schemas/util';

export const isUserData: (data: unknown) => boolean = (data) => {
  try {
    parseDataWithZodSchema(data, SchemaName.USER);
    return true;
  } catch (error) {
    return false;
  }
};
