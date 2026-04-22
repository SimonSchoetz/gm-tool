import { Input } from '@/components';
import { useSessionSteps } from '@/data-access-layer';
import { FCProps } from '@/types';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
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

  const [stepName, setStepName] = useState(step?.name ?? '');
  const [syncedStepId, setSyncedStepId] = useState(step?.id);

  if (!step) return null;

  if (step.id !== syncedStepId) {
    setSyncedStepId(step.id);
    setStepName(step.name ?? '');
  }

  return step.default_step_key !== null ? (
    <label className='step-name' htmlFor={`step-checkbox-${step.id}`}>
      {step.name}
    </label>
  ) : (
    <Input
      className='step-name'
      value={stepName}
      onChange={(e) => {
        setStepName(e.target.value);
        updateStep(step.id, { name: e.target.value });
      }}
      placeholder='Step name'
    />
  );
};
