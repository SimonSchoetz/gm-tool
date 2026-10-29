import { getDateString } from './getDateString';
import { getTimeString } from './getTimeString';

export const getDateTimeString = (dateString: string): string =>
  getDateString(dateString) + ' ' + getTimeString(dateString);
