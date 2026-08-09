import { FCProps } from '@/types';
import { useFaction } from '@/data-access-layer';
import { EntityPopupBody } from '../EntityPopupBody';

type Props = {
  entityId: string;
  adventureId: string | null;
};

export const FactionPopupContent: FCProps<Props> = ({
  entityId,
  adventureId,
}) => {
  const { faction, loading } = useFaction(entityId, adventureId ?? '');

  if (loading || !faction) return;

  return (
    <EntityPopupBody
      summary={faction.summary ?? null}
      imageId={faction.image_id ?? null}
      textEditorId={`faction-popup-${entityId}`}
    />
  );
};
