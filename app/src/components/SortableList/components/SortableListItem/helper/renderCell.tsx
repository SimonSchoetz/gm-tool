import { type ReactNode } from 'react';
import { AvatarCell } from '../components';
import { formatDateValue } from './formatDateValue';

const DATE_KEYS = new Set(['created_at', 'updated_at']);

export const renderCell = (
  key: string,
  item: Record<string, unknown>,
): ReactNode => {
  if (key === 'image_id')
    return <AvatarCell imageId={item.image_id as string | null | undefined} />;
  if (DATE_KEYS.has(key)) return formatDateValue(item[key]);
  return String(item[key] ?? '');
};
