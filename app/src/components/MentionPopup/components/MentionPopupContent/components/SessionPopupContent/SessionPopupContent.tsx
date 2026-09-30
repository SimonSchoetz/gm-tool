import { FCProps } from '@/types/fcProps.type';
import { useSession } from '@/data-access-layer';
import { EntityPopupBody } from '../EntityPopupBody/EntityPopupBody';

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
    <EntityPopupBody
      summary={session.summary}
      imageId={null}
      textEditorId={`session-popup-${entityId}`}
    />
  );
};
