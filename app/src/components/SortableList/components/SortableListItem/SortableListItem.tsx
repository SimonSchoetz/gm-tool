import './SortableListItem.css';
import { useMemo } from 'react';
import { FCProps } from '@/types';
import { GlassPanel } from '../../../GlassPanel/GlassPanel';
import { ActionContainer } from '../../../ActionContainer/ActionContainer';
import { useTableConfig } from '@/data-access-layer';
import { buildGridTemplate, isItemPinned } from '../../helper';
import { renderCell } from './helper';
import { RowActionsMenu } from './components';
import { cn } from '@/util';

type Props = {
  tableConfigId: string;
  item: Record<string, unknown>;
  onClick: (item: Record<string, unknown>) => void;
  dragWidths: Record<string, number> | null;
};

export const SortableListItem: FCProps<Props> = ({
  tableConfigId,
  item,
  onClick,
  dragWidths,
}) => {
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
  const itemId = typeof item.id === 'string' ? item.id : '';

  const isItemWithImage = 'image_id' in item;

  return (
    <li className='sortable-list-item'>
      <GlassPanel className='sortable-list-item--glass-panel'>
        <ActionContainer
          label={`Go to ${name}`}
          className='sortable-list-item--content'
          style={{ gridTemplateColumns }}
          onClick={() => {
            onClick(item);
          }}
        >
          {columns.map((col) => (
            <div
              className={cn(
                'sortable-list-item--content-section',
                isItemWithImage &&
                  col.key === 'image_id' &&
                  'sortable-list-item--content-section-with-image',
              )}
              key={col.key}
            >
              {/* span wrapper is needed for clipping text */}
              <span className='clip-text'>{renderCell(col.key, item)}</span>
            </div>
          ))}
        </ActionContainer>

        {/* RowActionsMenu must stay a sibling of ActionContainer, never nested inside it — both render a button, and a button nested inside another button is invalid HTML that the parser silently relocates, so nesting plus stopPropagation would depend on parser-repaired DOM structure instead of guaranteeing isolation from row navigation */}
        <RowActionsMenu
          tableConfigId={tableConfigId}
          itemId={itemId}
          isPinned={isItemPinned(item)}
        />
      </GlassPanel>
    </li>
  );
};
