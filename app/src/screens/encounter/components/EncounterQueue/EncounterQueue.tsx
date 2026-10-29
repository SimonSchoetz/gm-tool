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
import type { DragEndEvent } from '@dnd-kit/core';
import { useParams } from '@tanstack/react-router';
import { GlassPanel } from '@/components/GlassPanel/GlassPanel';
import { LoadingIcon } from '@/components/LoadingIcon/LoadingIcon';
import { useEncounterQueueItems } from '@/data-access-layer';
import { reorderIds } from '@/util/reorderIds';
import { useEncounterQueueEntries } from '../../hooks/useEncounterQueueEntries';
import { EncounterQueueEntry } from './components/EncounterQueueEntry';
import './EncounterQueue.css';

export const EncounterQueue = () => {
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

  if (loading) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // The full list in the DAL's order, never the shown ids: a shown-only list would rewrite sort_order for the shown items alone, and the cache update would drop the hidden and removed items.
    reorderQueueItems(
      reorderIds(
        queueItems.map((item) => item.id),
        String(active.id),
        String(over.id),
      ),
    );
  };

  return (
    <GlassPanel className='encounter-queue' intensity='off'>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={entries.map((entry) => entry.id)}
          strategy={verticalListSortingStrategy}
        >
          {entries.map((entry) => (
            <EncounterQueueEntry key={entry.id} {...entry} />
          ))}
        </SortableContext>
      </DndContext>
    </GlassPanel>
  );
};
