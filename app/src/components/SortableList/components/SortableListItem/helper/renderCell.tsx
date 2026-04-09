import { type ReactNode } from 'react';
import { AvatarCell } from '../components';
import { formatDateValue } from './formatDateValue';

const DATE_KEYS = new Set(['created_at', 'updated_at']);

export const renderCell = (
  key: string,
  item: Record<string, unknown>,
): ReactNode => {
  if (key === 'image_id') {
    assertIsString(item.image_id);
    return <AvatarCell imageId={item.image_id} />;
  }
  if (DATE_KEYS.has(key)) return formatDateValue(item[key]);
  return String(item[key] ?? '');
};

const assertIsString: (value: unknown) => asserts value is string = (value) => {
  if (typeof value !== 'string') {
    throw new Error('Expected a string');
  }
};
