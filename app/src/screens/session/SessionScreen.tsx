import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useSession } from '@/data-access-layer';
import { SessionHeader } from './components/SessionHeader';
import { PrepView } from './components/PrepView';
import { InGameView } from './components/InGameView';
import type { View } from './SessionScreen.types';
import './SessionScreen.css';

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
    <div className='session-screen'>
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
  );
};
