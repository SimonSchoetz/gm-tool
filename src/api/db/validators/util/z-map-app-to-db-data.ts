import { ZodRawShape, ZodObject, z } from 'zod';

export const zMapAppToDbData = <T extends ZodRawShape>(obj: ZodObject<T>) => {
  return obj.extend({
    _id: z.string(),
    _creationTime: z.number().min(1),
  });
};
