import { FCProps } from '@/types';
import { useSession } from '@/data-access-layer';
import { EntityPopupBody } from '../EntityPopupBody';
import './SessionPopupContent.css';

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
      summary={session.summary ?? null}
      imageId={null}
      textEditorId={`session-popup-${entityId}`}
    />
  );
};
