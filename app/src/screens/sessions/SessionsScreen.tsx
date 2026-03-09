import { useParams } from '@tanstack/react-router';
import { useSessions } from '@/data-access-layer';
import { SessionList } from './components';

export const SessionsScreen = () => {
  const { adventureId } = useParams({ strict: false });
  const { sessions, loading } = useSessions(adventureId ?? '');

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <SessionList sessions={sessions} />
    </div>
  );
};
