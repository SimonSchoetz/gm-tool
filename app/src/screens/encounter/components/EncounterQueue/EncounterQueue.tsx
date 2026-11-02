import { useState } from 'react';
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
} from '@dnd-kit/sortable';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useParams } from '@tanstack/react-router';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { LoadingIcon } from '@/components/LoadingIcon/LoadingIcon';
import { useEncounterQueueItems } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import type { SelectionModifiers } from '../../helper/applySelectionClick';
import { useEncounterQueueEntries } from '../../hooks/useEncounterQueueEntries';
import { EncounterQueueEntry } from './components/EncounterQueueEntry';
import { countOtherDragged } from './helper/countOtherDragged';
import { foldBlockDrag } from './helper/foldBlockDrag';
import { getBlockDragOtherIds } from './helper/getBlockDragOtherIds';
import { getDraggedIds } from './helper/getDraggedIds';
import { reorderIdsAsBlock } from './helper/reorderIdsAsBlock';
import './EncounterQueue.css';

type BlockDrag = { activeId: string; otherIds: string[]; folded: boolean };

type Props = {
  selectedIds: string[];
  onSelect: (id: string, modifiers: SelectionModifiers) => void;
};

export const EncounterQueue: FCProps<Props> = ({ selectedIds, onSelect }) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { entries, loading } = useEncounterQueueEntries();
  const { queueItems, reorderQueueItems } = useEncounterQueueItems(encounterId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const [blockDrag, setBlockDrag] = useState<BlockDrag | null>(null);

  if (loading) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    const activeId = String(event.active.id);
    const otherIds = getBlockDragOtherIds(selectedIds, activeId);
    // With no other selected entry the state would hold an empty `otherIds`, which folds, badges and adds nothing.
    if (otherIds.length === 0) return;

    setBlockDrag({ activeId, otherIds, folded: false });
    // The other entries leave the list one frame after the drag starts: removed in the commit that starts it, they leave the dragged entry above the pointer by their height, because dnd-kit measures the entry after the removal. The failure is invisible to tests (jsdom computes no layout).
    requestAnimationFrame(() => {
      setBlockDrag(foldBlockDrag);
    });
  };

  const handleDragCancel = () => {
    setBlockDrag(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setBlockDrag(null);
    if (!over || active.id === over.id) return;

    // The full list in the DAL's order, never the shown ids: a shown-only list would rewrite sort_order for the shown items alone, and the cache update would drop the hidden and removed items.
    reorderQueueItems(
      reorderIdsAsBlock(
        queueItems.map((item) => item.id),
        getDraggedIds(String(active.id), blockDrag),
        String(active.id),
        String(over.id),
      ),
    );
  };

  const shownEntries = entries.filter(
    (entry) => !(blockDrag?.folded && blockDrag.otherIds.includes(entry.id)),
  );

  return (
    <GlassPanel className='encounter-queue' intensity='off'>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={shownEntries.map((entry) => entry.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className='encounter-queue-list'>
            {shownEntries.map((entry) => (
              <EncounterQueueEntry
                key={entry.id}
                {...entry}
                selected={selectedIds.includes(entry.id)}
                otherDraggedCount={countOtherDragged(entry.id, blockDrag)}
                onSelect={onSelect}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </GlassPanel>
  );
};
