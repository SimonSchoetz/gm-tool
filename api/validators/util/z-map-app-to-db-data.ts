import { DbTable } from '@/enums';
import { zid } from 'convex-helpers/server/zod';
import { ZodRawShape, ZodObject, z } from 'zod';

export const zMapAppToDbData = <T extends ZodRawShape>(
  obj: ZodObject<T>,
  tableName: DbTable
) => {
  return obj.extend({
    _id: zid(tableName),
    _creationTime: z.number().min(1),
  });
};
