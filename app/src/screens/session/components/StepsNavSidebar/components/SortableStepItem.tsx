import type { SessionStep } from '@db/session-step';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';

type SortableStepItemProps = {
  step: SessionStep;
};

export const SortableStepItem = ({ step }: SortableStepItemProps) => {
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
