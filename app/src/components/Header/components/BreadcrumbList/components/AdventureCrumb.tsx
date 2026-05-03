import { Link, useParams } from '@tanstack/react-router';
import { useAdventure } from '@/data-access-layer';
import { FCProps } from '@/types';

type Props = object;

export const AdventureCrumb: FCProps<Props> = () => {
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
