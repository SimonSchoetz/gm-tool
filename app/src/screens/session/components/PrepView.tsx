import { useState } from 'react';
import { useSessionSteps } from '@/data-access-layer';
import { StepSection } from './StepSection/StepSection';
import { StepsNavSidebar } from './StepsNavSidebar/StepsNavSidebar';
import './PrepView.css';

type Props = {
  sessionId: string;
};

export const PrepView = ({ sessionId }: Props) => {
  const { steps, loading } = useSessionSteps(sessionId);
  const [visibleTooltips, setVisibleTooltips] = useState(new Set());

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
    setVisibleTooltips(visibleTooltips.size === 0 ? new Set(defaultStepIds) : new Set());
  };

  return (
    <div className='prep-view'>
      <StepsNavSidebar sessionId={sessionId} />

      <div className='prep-view-main'>
        <div className='prep-view-toolbar'>
          <button className='toggle-all-tooltips-btn' onClick={toggleAllTooltips}>
            {visibleTooltips.size === 0 ? 'Show all hints' : 'Hide all hints'}
          </button>
        </div>
        <div className='prep-view-steps'>
          {steps.map((step) => (
            <StepSection
              key={step.id}
              stepId={step.id}
              sessionId={sessionId}
              tooltipVisible={visibleTooltips.has(step.id)}
              onToggleTooltip={() => { toggleTooltipForStep(step.id); }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
