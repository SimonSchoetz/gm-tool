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

export const SortableListItem = ({ tableConfigId, item, onClick, dragWidths }: Props) => {
  const { config } = useTableConfig(tableConfigId);
  const columns = config?.layout.columns ?? [];

  const gridTemplateColumns = useMemo(() => {
    const keys = columns.map((c) => c.key);
    const widths = dragWidths ?? Object.fromEntries(columns.map((c) => [c.key, c.width]));
    return buildGridTemplate(keys, widths);
  }, [columns, dragWidths]);

  return (
    <li className='sortable-list-item'>
      <GlassPanel intensity='bright'>
        <ActionContainer
          label={`Go to ${item.name ?? ''}`}
          className='sortable-list-item__content-container'
          style={{ gridTemplateColumns }}
          onClick={() => { onClick(item); }}
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
