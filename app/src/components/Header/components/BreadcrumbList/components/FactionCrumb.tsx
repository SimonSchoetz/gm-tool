import { Link, useParams } from '@tanstack/react-router';
import { useFaction } from '@/data-access-layer';

export const FactionCrumb = () => {
  const { adventureId, factionId } = useParams({ strict: false });
  const { faction } = useFaction(factionId ?? '', adventureId ?? '');

  return (
    <Link
      to='/adventure/$adventureId/faction/$factionId'
      params={{ adventureId: adventureId ?? '', factionId: factionId ?? '' }}
    >
      {faction?.name ?? '…'}
    </Link>
  );
};
