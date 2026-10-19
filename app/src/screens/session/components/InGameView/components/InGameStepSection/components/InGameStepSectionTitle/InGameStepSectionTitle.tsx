import { useSessionSteps } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { findLazyDmStep } from '@domain';
import { useParams } from '@tanstack/react-router';
import './InGameStepSectionTitle.css';

type Props = {
  stepId: string;
};

export const InGameStepSectionTitle: FCProps<Props> = ({ stepId }) => {
  const { sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { steps } = useSessionSteps(sessionId);
  const step = steps.find((s) => s.id === stepId) ?? null;

  if (!step) return;

  if (step.name) {
    return <h2 className='in-game-step-section-title'>{step.name}</h2>;
  }

  if (step.default_step_key) {
    const definition = findLazyDmStep(step.default_step_key);
    if (definition) {
      return <h2 className='in-game-step-section-title'>{definition.name}</h2>;
    }
  }
};
