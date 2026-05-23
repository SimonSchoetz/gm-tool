import { FCProps } from '@/types';
import { useFoe } from '@/data-access-layer';
import { EntityPopupBody } from '../EntityPopupBody';
import './FoePopupContent.css';

type Props = {
  entityId: string;
  adventureId: string | null;
};

export const FoePopupContent: FCProps<Props> = ({ entityId, adventureId }) => {
  const { foe, loading } = useFoe(entityId, adventureId ?? '');

  if (loading || !foe) return null;

  return (
    <EntityPopupBody
      summary={foe.summary ?? null}
      imageId={foe.image_id ?? null}
      textEditorId={`foe-popup-${entityId}`}
    />
  );
};
