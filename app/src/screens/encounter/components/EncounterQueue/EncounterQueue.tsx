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
import {
  useAdventureBaseEntities,
  useEncounterQueueItems,
} from '@/data-access-layer';
import { reorderIds } from '@/util/reorderIds';
import { EncounterQueueEntry } from './components/EncounterQueueEntry';
import { buildQueueEntries } from './helper/buildQueueEntries';
import './EncounterQueue.css';

export const EncounterQueue = () => {
  const { adventureId, encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const {
    queueItems,
    loading: queueLoading,
    reorderQueueItems,
  } = useEncounterQueueItems(encounterId);
  const { baseEntities, loading: entitiesLoading } =
    useAdventureBaseEntities(adventureId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  if (queueLoading || entitiesLoading) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  const entries = buildQueueEntries(queueItems, baseEntities);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    reorderQueueItems(
      reorderIds(
        entries.map((entry) => entry.id),
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
