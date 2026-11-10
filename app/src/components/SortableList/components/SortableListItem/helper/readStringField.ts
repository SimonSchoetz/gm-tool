// List rows are untyped records, so a field shown as text falls back to '' when it holds anything but a string.
export const readStringField = (
  item: Record<string, unknown>,
  key: string,
): string => {
  const value = item[key];
  return typeof value === 'string' ? value : '';
};
