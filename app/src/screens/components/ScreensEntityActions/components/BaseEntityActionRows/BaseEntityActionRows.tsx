import { buildBaseEntityListPath, type BaseEntityType } from '@domain';
import { useBaseEntity } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import {
  EntityActionRows,
  type AfterDelete,
} from '../EntityActionRows/EntityActionRows';

type Props = {
  entityType: BaseEntityType;
  entityId: string;
  adventureId: string;
  afterDelete: AfterDelete;
  onChoose: () => void;
};

export const BaseEntityActionRows: FCProps<Props> = ({
  entityType,
  entityId,
  adventureId,
  afterDelete,
  onChoose,
}) => {
  const { baseEntity, deleteBaseEntity, duplicateBaseEntity } = useBaseEntity(
    entityType,
    entityId,
    adventureId,
  );

  const listPath = buildBaseEntityListPath(entityType, adventureId);

  return (
    <EntityActionRows
      entityType={entityType}
      adventureId={adventureId}
      name={baseEntity?.name ?? ''}
      listPath={listPath}
      canDelete={baseEntity !== null}
      afterDelete={afterDelete}
      onChoose={onChoose}
      duplicate={duplicateBaseEntity}
      deleteEntity={deleteBaseEntity}
    />
  );
};
