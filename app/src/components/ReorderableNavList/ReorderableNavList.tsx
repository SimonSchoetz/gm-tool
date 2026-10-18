import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import type { DragEndEvent } from '@dnd-kit/core';
import type { Ref } from 'react';
import { FCProps } from '@/types/fcProps.type';
import { GlassPanel } from '../GlassPanel/GlassPanel';
import { NewItemBtn } from '../NewItemBtn/NewItemBtn';
import { ReorderableNavListItem } from './components/ReorderableNavListItem/ReorderableNavListItem';
import './ReorderableNavList.css';

type Props = {
  items: { id: string; label: string; isChecked: boolean }[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  newItem: { label: string; onClick: () => void } | null;
  newItemRef: Ref<HTMLButtonElement>;
};

export const ReorderableNavList: FCProps<Props> = ({
  items,
  activeId,
  onSelect,
  onReorder,
  newItem,
  newItemRef,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered.map((item) => item.id));
  };

  return (
    <GlassPanel className='reorderable-nav-list' intensity='off'>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((item) => (
            <ReorderableNavListItem
              key={item.id}
              id={item.id}
              label={item.label}
              variant={
                item.id === activeId
                  ? 'active'
                  : item.isChecked
                    ? 'checked'
                    : null
              }
              onSelect={onSelect}
            />
          ))}
        </SortableContext>
      </DndContext>
      {newItem && (
        <NewItemBtn
          ref={newItemRef}
          className='reorderable-nav-list-new-item-btn'
          label={newItem.label}
          suppressAnimation
          onClick={newItem.onClick}
        />
      )}
    </GlassPanel>
  );
};
