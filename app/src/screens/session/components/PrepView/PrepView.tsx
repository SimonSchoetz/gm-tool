import { useSessionSteps } from '@/data-access-layer';
import { StepSection } from './components';
import { FCProps } from '@/types';
import { useParams } from '@tanstack/react-router';

type Props = {
  visibleTooltips: Set<string>;
  onToggleTooltip: (stepId: string) => void;
};

export const PrepView: FCProps<Props> = ({
  visibleTooltips,
  onToggleTooltip,
}) => {
  const { sessionId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });
  const { steps, loading } = useSessionSteps(sessionId);

  if (loading) {
    return <div>Loading steps...</div>;
  }

  return (
    <>
      {steps.map((step) => (
        <StepSection
          key={step.id}
          stepId={step.id}
          tooltipVisible={visibleTooltips.has(step.id)}
          onToggleTooltip={() => {
            onToggleTooltip(step.id);
          }}
        />
      ))}
    </>
  );
};
