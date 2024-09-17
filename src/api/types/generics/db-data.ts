export type DbData<T> = T & {
  _id: string;
  _creationTime: number;
};
