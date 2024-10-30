export type AsyncSearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;
