import { parseBasicStatBlockHpInput } from '@domain';

export const readSaveableHp = (input: {
  value: string;
  validity: Pick<ValidityState, 'badInput'>;
}): ReturnType<typeof parseBasicStatBlockHpInput> => {
  if (input.validity.badInput) return { valid: false };
  return parseBasicStatBlockHpInput(input.value);
};
