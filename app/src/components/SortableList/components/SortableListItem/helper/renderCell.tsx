import { type ReactNode } from 'react';
import { AvatarCell } from '../components';
import { formatDateValue } from './formatDateValue';

const DATE_KEYS = new Set(['created_at', 'updated_at']);

export const renderCell = (
  key: string,
  item: Record<string, unknown>,
): ReactNode => {
  if (key === 'image_id') {
    const imageId = typeof item.image_id === 'string' ? item.image_id : '';
    return <AvatarCell imageId={imageId} />;
  }
  if (DATE_KEYS.has(key)) return formatDateValue(item[key]);
  const value = item[key];
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  // eslint-disable-next-line @typescript-eslint/no-base-to-string -- value is a non-object primitive after nullish and object guards above
  return String(value);
};
