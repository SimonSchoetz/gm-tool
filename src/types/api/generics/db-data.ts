import { DbTable } from '@/enums';
import { Id } from '../../../../convex/_generated/dataModel';

export type DbData<T> = T & {
  _id: Id<DbTable>;
  _creationTime: number;
};
