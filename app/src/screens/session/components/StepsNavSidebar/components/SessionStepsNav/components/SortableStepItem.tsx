import type { SessionStep } from '@db/session-step';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { ActionContainer } from '@/components';
import { cn } from '@/util';
import './SortableStepItem.css';
import { LAZY_DM_STEPS } from '@/domain';

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

  const lazyStep = LAZY_DM_STEPS.find((s) => s.key === step.default_step_key);
  const stepName = step.name ?? lazyStep?.name ?? 'Untitled Sepp';

  return (
    <ActionContainer
      ref={setNodeRef}
      style={style}
      className={cn(
        `steps-nav-item`,
        step.checked === 1 && 'steps-nav-item--checked',
      )}
      label={stepName}
      onClick={scrollToStep}
      {...attributes}
    >
      <span className='steps-nav-drag-handle' {...listeners}>
        ⠿
      </span>

      <div className='steps-nav-item-label'>{stepName}</div>
    </ActionContainer>
  );
};
