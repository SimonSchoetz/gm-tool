import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { useSession } from '@/data-access-layer';
import { Routes } from '@/routes';
import { SessionHeader } from './components/SessionHeader';
import { PrepView } from './components/PrepView';
import { InGameView } from './components/InGameView';
import './SessionScreen.css';

type View = 'prep' | 'ingame';

export const SessionScreen = () => {
  const { sessionId, adventureId } = useParams({
    from: `/${Routes.ADVENTURE}/$adventureId/${Routes.SESSION}/$sessionId`,
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
        <PrepView sessionId={sessionId} adventureId={adventureId} />
      ) : (
        <InGameView sessionId={sessionId} adventureId={adventureId} />
      )}
    </div>
  );
};
