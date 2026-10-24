import { parseWholeNumberInput } from '@domain';

export const readSaveableWholeNumber = (input: {
  value: string;
  validity: Pick<ValidityState, 'badInput'>;
}): ReturnType<typeof parseWholeNumberInput> => {
  if (input.validity.badInput) return { valid: false };
  return parseWholeNumberInput(input.value);
};
