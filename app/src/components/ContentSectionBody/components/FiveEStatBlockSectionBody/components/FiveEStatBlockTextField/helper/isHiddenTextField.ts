export const isHiddenTextField = (
  readOnly: boolean,
  savedValue: string,
): boolean => readOnly && savedValue.trim() === '';
