import { FCProps } from '@/types/fcProps.type';
import { useSession } from '@/data-access-layer';
import { EntityPopupBody } from '../../../../../EntityPopupBody/EntityPopupBody';
import { EntityPopupBodyText } from '../EntityPopupBodyText/EntityPopupBodyText';

type Props = {
  entityId: string;
  adventureId: string | null;
};

export const SessionPopupContent: FCProps<Props> = ({
  entityId,
  adventureId,
}) => {
  const { session, loading } = useSession(entityId, adventureId ?? '');

  if (loading || !session) return;

  return (
    <EntityPopupBody imageId={null} imageTitle={null}>
      <EntityPopupBodyText
        text={session.summary}
        textEditorId={`session-popup-${entityId}`}
      />
    </EntityPopupBody>
  );
};
