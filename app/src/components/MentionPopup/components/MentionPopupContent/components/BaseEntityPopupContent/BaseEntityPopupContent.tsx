import { FCProps } from '@/types';
import { useBaseEntity } from '@/data-access-layer';
import type { BaseEntityType } from '@domain/entities';
import { EntityPopupBody } from '../EntityPopupBody';

type Props = {
  entityType: BaseEntityType;
  entityId: string;
  adventureId: string | null;
};

export const BaseEntityPopupContent: FCProps<Props> = ({
  entityType,
  entityId,
  adventureId,
}) => {
  const { baseEntity, loading } = useBaseEntity(
    entityType,
    entityId,
    adventureId ?? '',
  );

  if (loading || !baseEntity) return;

  return (
    <EntityPopupBody
      summary={baseEntity.summary}
      imageId={baseEntity.image_id}
      textEditorId={`${entityType}-popup-${entityId}`}
    />
  );
};
