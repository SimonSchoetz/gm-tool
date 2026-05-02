import { Link, useParams } from '@tanstack/react-router';
import { useSession } from '@/data-access-layer';
import { FCProps } from '@/types';

type Props = Record<string, never>;

export const SessionCrumb: FCProps<Props> = () => {
  const { adventureId, sessionId } = useParams({ strict: false });
  const { session } = useSession(sessionId ?? '', adventureId ?? '');

  return (
    <Link
      to='/adventure/$adventureId/session/$sessionId'
      params={{ adventureId: adventureId ?? '', sessionId: sessionId ?? '' }}
    >
      {session?.name ?? '…'}
    </Link>
  );
};
