import { ZodRawShape, ZodObject, z } from 'zod';

export const zMapDbToAppData = <T extends ZodRawShape>(obj: ZodObject<T>) => {
  return obj.extend({
    id: z.string().min(1),
    createdAt: z.string().min(1), // ISO string
  });
};
