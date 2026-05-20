import { Link, useParams } from '@tanstack/react-router';
import { useItem } from '@/data-access-layer';

export const ItemCrumb = () => {
  const { adventureId, itemId } = useParams({ strict: false });
  const { item } = useItem(itemId ?? '', adventureId ?? '');

  return (
    <Link
      to='/adventure/$adventureId/item/$itemId'
      params={{ adventureId: adventureId ?? '', itemId: itemId ?? '' }}
    >
      {item?.name ?? '…'}
    </Link>
  );
};
