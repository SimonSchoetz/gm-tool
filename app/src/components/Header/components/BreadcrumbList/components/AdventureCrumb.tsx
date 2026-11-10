import { Link, useParams } from '@tanstack/react-router';
import { useAdventure } from '@/data-access-layer';

export const AdventureCrumb = () => {
  const params = useParams({ strict: false });
  const adventureId = params.adventureId ?? '';
  const { adventure } = useAdventure(adventureId);

  const linkParams = { adventureId };

  return (
    <Link to='/adventure/$adventureId' params={linkParams}>
      {adventure?.name ?? '…'}
    </Link>
  );
};
