import { useSessions } from '@/data-access-layer/sessions';
import { SessionList } from './components';

export const SessionScreen = () => {
  const { sessions, loading } = useSessions();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <SessionList sessions={sessions} />
    </div>
  );
};
