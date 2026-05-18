import { Link, useParams } from '@tanstack/react-router';
import { useFoe } from '@/data-access-layer';

export const FoeCrumb = () => {
  const { adventureId, foeId } = useParams({ strict: false });
  const { foe } = useFoe(foeId ?? '', adventureId ?? '');

  return (
    <Link
      to='/adventure/$adventureId/foe/$foeId'
      params={{ adventureId: adventureId ?? '', foeId: foeId ?? '' }}
    >
      {foe?.name ?? '…'}
    </Link>
  );
};
