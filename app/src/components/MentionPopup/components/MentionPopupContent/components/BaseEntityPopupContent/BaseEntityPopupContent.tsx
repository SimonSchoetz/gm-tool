import { FCProps } from '@/types';
import {
  useBaseEntity,
  useBaseEntityContentSections,
} from '@/data-access-layer';
import type { BaseEntityType } from '@domain/entities';
import { EntityPopupBody } from '../EntityPopupBody/EntityPopupBody';

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
  const { summarySection, loading: sectionsLoading } =
    useBaseEntityContentSections(entityId);

  if (loading || sectionsLoading || !baseEntity) return;

  return (
    <EntityPopupBody
      summary={summarySection?.content ?? null}
      imageId={baseEntity.image_id}
      textEditorId={`${entityType}-popup-${entityId}`}
    />
  );
};
