import './SortableListItem.css';
import { FCProps } from '@/types/fcProps.type';
import type { ImagePlaceholderEntityType } from '../../../EntityPlaceholderIcon';
import { GlassPanel } from '../../../GlassPanel/GlassPanel';
import { ActionContainer } from '../../../ActionContainer/ActionContainer';
import { useTableConfig } from '@/data-access-layer';
import { isItemPinned } from '../../helper/isItemPinned';
import { buildItemGridTemplate } from './helper/buildItemGridTemplate';
import { readStringField } from './helper/readStringField';
import { renderCell } from './helper/renderCell';
import { RowActionsMenu } from './components/RowActionsMenu';
import { cn } from '@/util/className';

type Props = {
  tableConfigId: string;
  item: Record<string, unknown>;
  onClick: (item: Record<string, unknown>) => void;
  dragWidths: Record<string, number> | null;
  entityType: ImagePlaceholderEntityType | null;
};

export const SortableListItem: FCProps<Props> = ({
  tableConfigId,
  item,
  onClick,
  dragWidths,
  entityType,
}) => {
  const { config } = useTableConfig(tableConfigId);
  const columns = config?.layout.columns ?? [];

  const gridTemplateColumns = buildItemGridTemplate(columns, dragWidths);

  const name = readStringField(item, 'name');
  const itemId = readStringField(item, 'id');

  const isItemWithImage = 'image_id' in item;

  const isPinned = isItemPinned(item);

  const onItemClick = () => {
    onClick(item);
  };

  return (
    <li className='sortable-list-item'>
      <GlassPanel className='sortable-list-item--glass-panel'>
        <ActionContainer
          label={`Go to ${name}`}
          className='sortable-list-item--content'
          style={{ gridTemplateColumns }}
          onClick={onItemClick}
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
              <span className='clip-text'>
                {renderCell(col.key, item, entityType)}
              </span>
            </div>
          ))}
        </ActionContainer>

        {/* RowActionsMenu must stay a sibling of ActionContainer, never nested inside it — both render a button, and a button nested inside another button is invalid HTML that the parser silently relocates, so nesting plus stopPropagation would depend on parser-repaired DOM structure instead of guaranteeing isolation from row navigation */}
        <RowActionsMenu
          tableConfigId={tableConfigId}
          itemId={itemId}
          isPinned={isPinned}
        />
      </GlassPanel>
    </li>
  );
};
