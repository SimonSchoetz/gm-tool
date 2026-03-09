import { useSession, useSessionSteps } from '@/data-access-layer';
import './InGameView.css';

type Props = {
  sessionId: string;
  adventureId: string;
};

export const InGameView = ({ sessionId, adventureId }: Props) => {
  const { session, loading: sessionLoading } = useSession(sessionId, adventureId);
  const { steps, loading: stepsLoading } = useSessionSteps(sessionId);

  if (sessionLoading || stepsLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='in-game-view'>
      {/* Summary editor added in sub-feature 14 */}
      <div className='in-game-summary-placeholder'>
        <span>{session?.summary ?? ''}</span>
      </div>

      <div className='in-game-steps'>
        {steps.map((step) => (
          <div key={step.id} className='in-game-step-placeholder'>
            {/* Read-only StepSection added in sub-feature 13 */}
            <span>{step.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
