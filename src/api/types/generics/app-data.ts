export type AppData<T> = T & {
  id: string;
  createdAt: string; // ISO date string
};
