import { FCProps } from '@/types';
import { useItem } from '@/data-access-layer';
import { EntityPopupBody } from '../EntityPopupBody';
import './ItemPopupContent.css';

type Props = {
  entityId: string;
  adventureId: string | null;
};

export const ItemPopupContent: FCProps<Props> = ({ entityId, adventureId }) => {
  const { item, loading } = useItem(entityId, adventureId ?? '');

  if (loading || !item) return null;

  return (
    <EntityPopupBody
      summary={item.summary ?? null}
      imageId={item.image_id ?? null}
      textEditorId={`item-popup-${entityId}`}
    />
  );
};
