import { useState } from 'react';
import { useSessionSteps } from '@/data-access-layer';
import { StepSection } from './StepSection/StepSection';
import './PrepView.css';
import { Button } from '@/components';

type Props = {
  sessionId: string;
};

export const PrepView = ({ sessionId }: Props) => {
  const { steps, loading } = useSessionSteps(sessionId);
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-arguments -- new Set() infers Set<unknown> without the explicit type arg
  const [visibleTooltips, setVisibleTooltips] = useState<Set<string>>(
    new Set(),
  );

  if (loading) {
    return <div>Loading steps...</div>;
  }

  const toggleTooltipForStep = (stepId: string) => {
    setVisibleTooltips((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const defaultStepIds = steps
    .filter((s) => s.default_step_key !== null)
    .map((s) => s.id);

  const toggleAllTooltips = () => {
    setVisibleTooltips(
      visibleTooltips.size === 0 ? new Set(defaultStepIds) : new Set(),
    );
  };

  return (
    <div className='prep-view'>
      <div className='prep-view-main'>
        <div className='prep-view-toolbar'>
          <Button
            className='toggle-all-tooltips-btn'
            onClick={toggleAllTooltips}
            label={
              visibleTooltips.size === 0 ? 'Show all hints' : 'Hide all hints'
            }
          />
        </div>
        <div className='prep-view-steps'>
          {steps.map((step) => (
            <StepSection
              key={step.id}
              stepId={step.id}
              sessionId={sessionId}
              tooltipVisible={visibleTooltips.has(step.id)}
              onToggleTooltip={() => {
                toggleTooltipForStep(step.id);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
