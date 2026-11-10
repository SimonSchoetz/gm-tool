import { Link, useParams } from '@tanstack/react-router';
import { useEncounter } from '@/data-access-layer';

export const EncounterCrumb = () => {
  const params = useParams({ strict: false });
  const adventureId = params.adventureId ?? '';
  const encounterId = params.encounterId ?? '';
  const { encounter } = useEncounter(encounterId, adventureId);

  const linkParams = { adventureId, encounterId };

  return (
    <Link
      to='/adventure/$adventureId/encounter/$encounterId'
      params={linkParams}
    >
      {encounter?.name ?? '…'}
    </Link>
  );
};
