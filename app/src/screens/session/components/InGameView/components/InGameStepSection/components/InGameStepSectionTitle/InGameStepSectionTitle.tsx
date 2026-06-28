import { useSessionSteps } from '@/data-access-layer';
import { FCProps } from '@/types';
import { LAZY_DM_STEPS } from '@domain';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import './InGameStepSectionTitle.css';

type Props = {
  stepId: string;
};

export const InGameStepSectionTitle: FCProps<Props> = ({ stepId }) => {
  const { sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { steps } = useSessionSteps(sessionId);
  const step = steps.find((s) => s.id === stepId);

  const [stepName, setStepName] = useState(step?.name ?? '');
  const [syncedStepId, setSyncedStepId] = useState(step?.id);

  if (!step) return null;

  if (step.id !== syncedStepId) {
    setSyncedStepId(step.id);
    setStepName(step.name ?? '');
  }

  if (step.default_step_key !== null) {
    const definition = LAZY_DM_STEPS.find(
      (s) => s.key === step.default_step_key,
    );
    if (definition) {
      return <h2 className='in-game-step-section-title'>{definition.name}</h2>;
    }
  }
  return <h2 className='in-game-step-section-title'>{stepName}</h2>;
};
