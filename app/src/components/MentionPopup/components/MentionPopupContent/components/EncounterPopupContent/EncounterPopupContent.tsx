import { FCProps } from '@/types/fcProps.type';
import { useEncounter } from '@/data-access-layer';
import { buildTitledImage } from '@/util/buildTitledImage';
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

  const popupImage = buildTitledImage(encounter.image_id, encounter.name);

  return (
    <EntityPopupBody image={popupImage} onImageOpen={onPin}>
      <EntityPopupBodyText
        text={encounter.description ?? null}
        textEditorId={`encounter-popup-${entityId}`}
      />
    </EntityPopupBody>
  );
};
