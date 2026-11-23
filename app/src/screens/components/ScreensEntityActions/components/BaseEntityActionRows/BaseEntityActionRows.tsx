import {
  buildBaseEntityListPath,
  buildEntityPath,
  type BaseEntityType,
} from '@domain';
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

  const duplicate = async () =>
    buildEntityPath(entityType, await duplicateBaseEntity(), adventureId);

  return (
    <EntityActionRows
      name={baseEntity?.name ?? ''}
      listPath={listPath}
      afterDelete={afterDelete}
      onChoose={onChoose}
      duplicate={duplicate}
      deleteEntity={deleteBaseEntity}
    />
  );
};
