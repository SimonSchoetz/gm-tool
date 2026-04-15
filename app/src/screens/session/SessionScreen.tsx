import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useSession } from '@/data-access-layer';
import { SessionHeader } from './components/SessionHeader';
import { PrepView } from './components/PrepView';
import { InGameView } from './components/InGameView';
import './SessionScreen.css';
import { GlassPanel } from '@/components';
import { StepsNavSidebar } from './components/StepsNavSidebar/StepsNavSidebar';

export type View = 'prep' | 'ingame';

export const SessionScreen = () => {
  const { sessionId, adventureId } = useParams({
    from: '/adventure/$adventureId/session/$sessionId',
  });

  const { loading } = useSession(sessionId, adventureId);
  const [view, setView] = useState<View>('prep');

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <GlassPanel className='session-screen'>
      <StepsNavSidebar sessionId={sessionId} />

      <div>
        <SessionHeader
          sessionId={sessionId}
          adventureId={adventureId}
          view={view}
          onViewChange={setView}
        />
        {view === 'prep' ? (
          <PrepView sessionId={sessionId} />
        ) : (
          <InGameView sessionId={sessionId} adventureId={adventureId} />
        )}
      </div>
    </GlassPanel>
  );
};
