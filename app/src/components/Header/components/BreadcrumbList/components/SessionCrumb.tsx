import { Link, useParams } from '@tanstack/react-router';
import { useSession } from '@/data-access-layer';

export const SessionCrumb = () => {
  const params = useParams({ strict: false });
  const adventureId = params.adventureId ?? '';
  const sessionId = params.sessionId ?? '';
  const { session } = useSession(sessionId, adventureId);

  const linkParams = { adventureId, sessionId };

  return (
    <Link to='/adventure/$adventureId/session/$sessionId' params={linkParams}>
      {session?.name ?? '…'}
    </Link>
  );
};
