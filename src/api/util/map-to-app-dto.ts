import { AppData, DbData } from '@/types/api/generics';

export const mapToAppDto = <T>(dbData: DbData<T>): AppData<T> => {
  const { _id, _creationTime, ...rest } = dbData;
  return {
    ...(rest as T),
    id: _id,
    createdAt: new Date(_creationTime).toISOString(),
  };
};
