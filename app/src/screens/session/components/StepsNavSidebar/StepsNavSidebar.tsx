import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useSessionSteps } from '@/data-access-layer';
import type { SessionStep } from '@db/session-step';
import { NewItemBtn } from '@/components';
import './StepsNavSidebar.css';

type SortableStepItemProps = {
  step: SessionStep;
};

const SortableStepItem = ({ step }: SortableStepItemProps) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({
      id: step.id,
    });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const scrollToStep = () => {
    document.getElementById(`step-section-${step.id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`steps-nav-item${step.checked === 1 ? ' steps-nav-item--checked' : ''}`}
      {...attributes}
    >
      <span className='steps-nav-drag-handle' {...listeners}>
        ⠿
      </span>
      <button className='steps-nav-item-label' onClick={scrollToStep}>
        {step.name ?? 'Untitled Step'}
      </button>
    </div>
  );
};

type Props = {
  sessionId: string;
};

export const StepsNavSidebar = ({ sessionId }: Props) => {
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
