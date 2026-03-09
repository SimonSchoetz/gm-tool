import { useParams } from '@tanstack/react-router';
import { useSessions } from '@/data-access-layer';
import { Routes } from '@/routes';
import { SessionList } from './components';

export const SessionsScreen = () => {
  const { adventureId } = useParams({
    from: `/${Routes.ADVENTURE}/$adventureId/${Routes.SESSIONS}`,
  });
  const { sessions, loading } = useSessions(adventureId);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <SessionList sessions={sessions} />
    </div>
  );
};
