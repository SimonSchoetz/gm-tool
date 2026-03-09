import { useState } from 'react';
import { useSessionSteps } from '@/data-access-layer';
import './PrepView.css';

type Props = {
  sessionId: string;
  adventureId: string;
};

export const PrepView = ({ sessionId }: Props) => {
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
          <div key={step.id} className='prep-view-step-placeholder'>
            {/* StepSection added in sub-feature 6 */}
            <span>{step.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
