import { Link, useParams } from '@tanstack/react-router';
import { usePc } from '@/data-access-layer';

export const PcCrumb = () => {
  const { adventureId, pcId } = useParams({ strict: false });
  const { pc } = usePc(pcId ?? '', adventureId ?? '');

  return (
    <Link
      to='/adventure/$adventureId/pc/$pcId'
      params={{ adventureId: adventureId ?? '', pcId: pcId ?? '' }}
    >
      {pc?.name ?? '…'}
    </Link>
  );
};
