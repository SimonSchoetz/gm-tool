import { FCProps } from '@/types/fcProps.type';
import { useEncounter } from '@/data-access-layer';
import { EntityPopupBody } from '../../../../../EntityPopupBody/EntityPopupBody';
import { useMentionPopupHeader } from '../../../../hooks/useMentionPopupHeader';
import { EntityPopupBodyText } from '../EntityPopupBodyText/EntityPopupBodyText';

type Props = {
  entityId: string;
  adventureId: string | null;
};

export const EncounterPopupContent: FCProps<Props> = ({
  entityId,
  adventureId,
}) => {
  const { encounter, loading } = useEncounter(entityId, adventureId ?? '');
  const { onPin } = useMentionPopupHeader();

  if (loading || !encounter) return;

  return (
    <EntityPopupBody
      imageId={encounter.image_id}
      imageTitle={encounter.name}
      onImageOpen={onPin}
    >
      <EntityPopupBodyText
        text={encounter.description ?? null}
        textEditorId={`encounter-popup-${entityId}`}
      />
    </EntityPopupBody>
  );
};
