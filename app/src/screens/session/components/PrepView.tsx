import { useSessionSteps } from '@/data-access-layer';
import { StepSection } from './StepSection';
import './PrepView.css';
import { FCProps } from '@/types';

type Props = {
  sessionId: string;
  visibleTooltips: Set<string>;
  onToggleTooltip: (stepId: string) => void;
};

export const PrepView: FCProps<Props> = ({
  sessionId,
  visibleTooltips,
  onToggleTooltip,
}) => {
  const { steps, loading } = useSessionSteps(sessionId);

  if (loading) {
    return <div>Loading steps...</div>;
  }

  return (
    <div className='prep-view'>
      <div className='prep-view-main'>
        <div className='prep-view-steps'>
          {steps.map((step) => (
            <StepSection
              key={step.id}
              stepId={step.id}
              sessionId={sessionId}
              tooltipVisible={visibleTooltips.has(step.id)}
              onToggleTooltip={() => {
                onToggleTooltip(step.id);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
