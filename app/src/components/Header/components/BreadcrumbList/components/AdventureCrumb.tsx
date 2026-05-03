import { Link, useParams } from '@tanstack/react-router';
import { useAdventure } from '@/data-access-layer';

export const AdventureCrumb = () => {
  const { adventureId } = useParams({ strict: false });
  const { adventure } = useAdventure(adventureId ?? '');

  return (
    <Link
      to='/adventure/$adventureId'
      params={{ adventureId: adventureId ?? '' }}
    >
      {adventure?.name ?? '…'}
    </Link>
  );
};
