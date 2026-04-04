export const mergeUpdate = <T extends object>(
  base: T,
  patch: { [K in keyof T]?: T[K] | undefined },
): T => {
  const result = { ...base };
  for (const key of Object.keys(patch) as (keyof T)[]) {
    if (patch[key] !== undefined) {
      result[key] = patch[key] as T[typeof key];
    }
  }
  return result;
};
