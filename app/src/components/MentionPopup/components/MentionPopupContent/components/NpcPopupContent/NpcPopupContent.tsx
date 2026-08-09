import { FCProps } from '@/types';
import { useNpc } from '@/data-access-layer';
import { EntityPopupBody } from '../EntityPopupBody';

type Props = {
  entityId: string;
  adventureId: string | null;
};

export const NpcPopupContent: FCProps<Props> = ({ entityId, adventureId }) => {
  const { npc, loading } = useNpc(entityId, adventureId ?? '');

  if (loading || !npc) return;

  return (
    <EntityPopupBody
      summary={npc.summary ?? null}
      imageId={npc.image_id ?? null}
      textEditorId={`npc-popup-${entityId}`}
    />
  );
};
