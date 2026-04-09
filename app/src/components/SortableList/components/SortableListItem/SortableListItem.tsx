import './SortableListItem.css';
import { useMemo } from 'react';
import { GlassPanel, ActionContainer } from '@/components';
import { useTableConfig } from '@/data-access-layer';
import { buildGridTemplate } from '../../helper';
import { renderCell } from './helper';

type Props = {
  tableConfigId: string;
  item: Record<string, unknown>;
  onClick: (item: Record<string, unknown>) => void;
  dragWidths: Record<string, number> | null;
};

export const SortableListItem = ({
  tableConfigId,
  item,
  onClick,
  dragWidths,
}: Props) => {
  const { config } = useTableConfig(tableConfigId);
  const columns = config?.layout.columns ?? [];

  const gridTemplateColumns = useMemo(() => {
    const cols = config?.layout.columns ?? [];
    const keys = cols.map((c) => c.key);
    const widths =
      dragWidths ?? Object.fromEntries(cols.map((c) => [c.key, c.width]));
    return buildGridTemplate(keys, widths);
  }, [config?.layout.columns, dragWidths]);

  const name = typeof item.name === 'string' ? item.name : '';

  return (
    <li className='sortable-list-item'>
      <GlassPanel intensity='bright'>
        <ActionContainer
          label={`Go to ${name}`}
          className='sortable-list-item__content-container'
          style={{ gridTemplateColumns }}
          onClick={() => {
            onClick(item);
          }}
        >
          {columns.map((col) => (
            <div key={col.key}>
              <span>{renderCell(col.key, item)}</span>
            </div>
          ))}
        </ActionContainer>
      </GlassPanel>
    </li>
  );
};
