import { SyncedInput } from '@/components';
import { useSessionSteps } from '@/data-access-layer';
import { LAZY_DM_STEPS } from '@domain';
import { FCProps } from '@/types';
import { useParams } from '@tanstack/react-router';
import './StepSectionHeaderTitle.css';

type Props = {
  stepId: string;
};

export const StepSectionHeaderTitle: FCProps<Props> = ({ stepId }) => {
  const { sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { steps, updateStep } = useSessionSteps(sessionId);
  const step = steps.find((s) => s.id === stepId);

  if (!step) return null;

  if (step.default_step_key) {
    const definition = LAZY_DM_STEPS.find(
      (s) => s.key === step.default_step_key,
    );
    if (!definition) return null;
    return (
      <label className='step-name' htmlFor={`step-checkbox-${step.id}`}>
        {definition.name}
      </label>
    );
  }

  return (
    <SyncedInput
      className='step-name'
      initValue={step.name ?? ''}
      onCommit={(name) => {
        updateStep(step.id, { name });
      }}
      placeholder='Step name'
    />
  );
};
