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
import { useSessionSteps } from '@/data-access-layer';
import { NewItemBtn } from '@/components';
import './StepsNavSidebar.css';
import { useParams } from '@tanstack/react-router';
import { SortableStepItem } from './components';

export const StepsNavSidebar = () => {
  const { sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { steps, createStep, bulkReorder } = useSessionSteps(sessionId);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = steps.findIndex((s) => s.id === active.id);
    const newIndex = steps.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(steps, oldIndex, newIndex);
    bulkReorder(reordered.map((s) => s.id));
  };

  return (
    <div className='steps-nav-sidebar'>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {steps.map((step) => (
            <SortableStepItem key={step.id} step={step} />
          ))}
        </SortableContext>
      </DndContext>

      <NewItemBtn
        type='list-item'
        label='+'
        onClick={() => {
          void createStep();
        }}
      />
    </div>
  );
};
