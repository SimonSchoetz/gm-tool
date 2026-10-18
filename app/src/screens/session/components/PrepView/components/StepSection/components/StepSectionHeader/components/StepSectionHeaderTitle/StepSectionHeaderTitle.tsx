import { SyncedInput } from '@/components/SyncedInput/SyncedInput';
import { useSessionSteps } from '@/data-access-layer';
import { findLazyDmStep } from '@domain';
import { FCProps } from '@/types/fcProps.type';
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
  const step = steps.find((s) => s.id === stepId) ?? null;

  if (!step) return;

  if (step.default_step_key) {
    const definition = findLazyDmStep(step.default_step_key);
    if (!definition) return;
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
