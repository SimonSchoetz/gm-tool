import { Link, useParams } from '@tanstack/react-router';
import { useEncounter } from '@/data-access-layer';

export const EncounterCrumb = () => {
  const { adventureId, encounterId } = useParams({ strict: false });
  const { encounter } = useEncounter(encounterId ?? '', adventureId ?? '');

  return (
    <Link
      to='/adventure/$adventureId/encounter/$encounterId'
      params={{
        adventureId: adventureId ?? '',
        encounterId: encounterId ?? '',
      }}
    >
      {encounter?.name ?? '…'}
    </Link>
  );
};
