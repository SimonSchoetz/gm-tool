import { FCProps } from '@/types';
import { useEncounter } from '@/data-access-layer';
import { EntityPopupBody } from '../EntityPopupBody';

type Props = {
  entityId: string;
  adventureId: string | null;
};

export const EncounterPopupContent: FCProps<Props> = ({
  entityId,
  adventureId,
}) => {
  const { encounter, loading } = useEncounter(entityId, adventureId ?? '');

  if (loading || !encounter) return;

  return (
    <EntityPopupBody
      summary={encounter.description ?? null}
      imageId={null}
      textEditorId={`encounter-popup-${entityId}`}
    />
  );
};
