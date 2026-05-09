import { getDateTimeString } from '@util/getDateTimeString';

export const formatDateValue = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return getDateTimeString(value);
};
