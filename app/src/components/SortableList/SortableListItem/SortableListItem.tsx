import './SortableListItem.css';
import { useMemo } from 'react';
import { UserSquareIcon } from 'lucide-react';
import {
  ActionContainer,
  GlassPanel,
  ImageById,
  ImagePlaceholderFrame,
} from '@/components';
import { useTableConfig } from '@/data-access-layer/table-config';

const DATE_KEYS = new Set(['created_at', 'updated_at']);
const DEFAULT_COLUMN_WIDTH = 150;

type Props = {
  tableConfigId: string;
  item: Record<string, unknown>;
  onClick: (item: Record<string, unknown>) => void;
};

const AvatarCell = ({ imageId }: { imageId: string | null | undefined }) => (
  <ImagePlaceholderFrame
    dimensions={{ width: '100px', height: '100px' }}
    radius='lg'
  >
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

const renderCell = (
  key: string,
  item: Record<string, unknown>,
): React.ReactNode => {
  if (key === 'image_id')
    return <AvatarCell imageId={item.image_id as string | null | undefined} />;
  if (DATE_KEYS.has(key)) return formatDateValue(item[key]);
  return String(item[key] ?? '');
};

export const SortableListItem = ({ tableConfigId, item, onClick }: Props) => {
  const { config } = useTableConfig(tableConfigId);
  const columns = config?.layout.columns ?? [];

  const gridTemplateColumns = useMemo(() => {
    const lastIndex = columns.length - 1;
    return columns
      .map((col, index) => {
        const width = col.width ?? DEFAULT_COLUMN_WIDTH;
        return index === lastIndex ? `minmax(${width}px, 1fr)` : `${width}px`;
      })
      .join(' ');
  }, [columns]);

  return (
    <li>
      <GlassPanel intensity='bright'>
        <ActionContainer
          label={`Go to ${item.name ?? ''}`}
          className='sortable-list__row'
          style={{ gridTemplateColumns }}
          onClick={() => onClick(item)}
        >
          {columns.map((col) => (
            <div key={col.key}>{renderCell(col.key, item)}</div>
          ))}
        </ActionContainer>
      </GlassPanel>
    </li>
  );
};
