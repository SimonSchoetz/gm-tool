import { Link, useParams } from '@tanstack/react-router';
import { useLocation } from '@/data-access-layer';

export const LocationCrumb = () => {
  const { adventureId, locationId } = useParams({ strict: false });
  const { location } = useLocation(locationId ?? '', adventureId ?? '');

  return (
    <Link
      to='/adventure/$adventureId/location/$locationId'
      params={{ adventureId: adventureId ?? '', locationId: locationId ?? '' }}
    >
      {location?.name ?? '…'}
    </Link>
  );
};
