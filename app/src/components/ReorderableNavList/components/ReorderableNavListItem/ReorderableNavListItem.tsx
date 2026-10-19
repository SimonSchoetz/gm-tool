import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { ActionContainer } from '../../../ActionContainer/ActionContainer';
import { cn } from '@/util/className';
import { FCProps } from '@/types/fcProps.type';
import './ReorderableNavListItem.css';

type Props = {
  id: string;
  label: string;
  variant: 'checked' | 'active' | null;
  onSelect: (id: string) => void;
};

export const ReorderableNavListItem: FCProps<Props> = ({
  id,
  label,
  variant,
  onSelect,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <ActionContainer
      ref={setNodeRef}
      style={style}
      className={cn(
        'reorderable-nav-list-item',
        variant && `reorderable-nav-list-item--${variant}`,
      )}
      label={label}
      onClick={() => {
        onSelect(id);
      }}
      {...attributes}
    >
      <span className='reorderable-nav-list-item-drag-handle' {...listeners}>
        ⠿
      </span>

      <div className='reorderable-nav-list-item-label clip-text'>{label}</div>
    </ActionContainer>
  );
};
