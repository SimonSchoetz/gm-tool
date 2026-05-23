import { FCProps } from '@/types';
import { usePc } from '@/data-access-layer';
import { EntityPopupBody } from '../EntityPopupBody';
import './PcPopupContent.css';

type Props = {
  entityId: string;
  adventureId: string | null;
};

export const PcPopupContent: FCProps<Props> = ({ entityId, adventureId }) => {
  const { pc, loading } = usePc(entityId, adventureId ?? '');

  if (loading || !pc) return null;

  return (
    <EntityPopupBody
      summary={pc.summary ?? null}
      imageId={pc.image_id ?? null}
      textEditorId={`pc-popup-${entityId}`}
    />
  );
};
