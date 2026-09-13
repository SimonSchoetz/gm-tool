import { Link, useParams } from '@tanstack/react-router';
import { buildEntityPath, type BaseEntityType } from '@domain';
import { useBaseEntity } from '@/data-access-layer';
import { FCProps } from '@/types';

type Props = { entityType: BaseEntityType };

export const BaseEntityCrumb: FCProps<Props> = ({ entityType }) => {
  const params = useParams({ strict: false });
  const baseEntityId = params.baseEntityId ?? '';
  const adventureId = params.adventureId ?? '';
  const { baseEntity } = useBaseEntity(entityType, baseEntityId, adventureId);

  return (
    <Link to={buildEntityPath(entityType, baseEntityId, adventureId)}>
      {baseEntity?.name ?? '…'}
    </Link>
  );
};
