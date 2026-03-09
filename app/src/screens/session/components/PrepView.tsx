import { useState } from 'react';
import { useSessionSteps } from '@/data-access-layer';
import { StepSection } from './StepSection/StepSection';
import './PrepView.css';

type Props = {
  sessionId: string;
  adventureId: string;
};

export const PrepView = ({ sessionId, adventureId }: Props) => {
  const { steps, loading } = useSessionSteps(sessionId);
  // visibleTooltips wired in sub-feature 7
  const [_visibleTooltips, _setVisibleTooltips] = useState<Set<string>>(new Set());

  if (loading) {
    return <div>Loading steps...</div>;
  }

  return (
    <div className='prep-view'>
      <div className='prep-view-steps'>
        {steps.map((step) => (
          <StepSection
            key={step.id}
            stepId={step.id}
            sessionId={sessionId}
            adventureId={adventureId}
            tooltipVisible={false}
            onToggleTooltip={() => {}}
          />
        ))}
      </div>
    </div>
  );
};
