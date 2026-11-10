export const getInputPlaceholder = (
  readOnly: boolean,
  placeholder: string,
): string | null => (readOnly ? null : placeholder);
