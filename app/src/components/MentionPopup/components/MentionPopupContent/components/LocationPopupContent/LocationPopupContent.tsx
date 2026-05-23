import { FCProps } from '@/types';
import { useLocation } from '@/data-access-layer';
import { EntityPopupBody } from '../EntityPopupBody';
import './LocationPopupContent.css';

type Props = {
  entityId: string;
  adventureId: string | null;
};

export const LocationPopupContent: FCProps<Props> = ({
  entityId,
  adventureId,
}) => {
  const { location, loading } = useLocation(entityId, adventureId ?? '');

  if (loading || !location) return null;

  return (
    <EntityPopupBody
      summary={location.summary ?? null}
      imageId={location.image_id ?? null}
      textEditorId={`location-popup-${entityId}`}
    />
  );
};
