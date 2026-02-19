import './SortableListItem.css';
import { UserSquareIcon } from 'lucide-react';
import { ListColumn } from '../SortableList';
import { ActionContainer, GlassPanel, ImageById, ImagePlaceholderFrame } from '@/components';

const DATE_KEYS = new Set(['created_at', 'updated_at']);

type Props<T extends Record<string, unknown>> = {
  item: T;
  columns: ListColumn<T>[];
  onClick: (item: T) => void;
};

const AvatarCell = ({ imageId }: { imageId: string | null | undefined }) => (
  <ImagePlaceholderFrame dimensions={{ width: '100px', height: '100px' }} radius='lg'>
    {imageId ? (
      <ImageById imageId={imageId} className='sortable-list-item__avatar-img' />
    ) : (
      <UserSquareIcon className='sortable-list-item__avatar-icon' />
    )}
  </ImagePlaceholderFrame>
);

const formatDateValue = (value: unknown): string => {
  if (!value) return '';
  const date = new Date(value as string | number);
  return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
};

const renderCell = <T extends Record<string, unknown>>(
  col: ListColumn<T>,
  item: T,
): React.ReactNode => {
  if (col.render) return col.render(item);
  if (col.key === 'image_id') return <AvatarCell imageId={item.image_id as string | null | undefined} />;
  if (DATE_KEYS.has(col.key)) return formatDateValue(item[col.key]);
  return String(item[col.key] ?? '');
};

export const SortableListItem = <T extends Record<string, unknown>>({
  item,
  columns,
  onClick,
}: Props<T>) => {
  return (
    <li>
      <GlassPanel intensity='bright'>
        <ActionContainer
          label={`Go to ${item.name ?? ''}`}
          className='sortable-list__row'
          onClick={() => onClick(item)}
        >
          {columns.map((col) => (
            <div key={col.key}>{renderCell(col, item)}</div>
          ))}
        </ActionContainer>
      </GlassPanel>
    </li>
  );
};
