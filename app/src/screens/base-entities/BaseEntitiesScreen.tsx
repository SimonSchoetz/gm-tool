import { useParams, useRouter } from '@tanstack/react-router';
import { useBaseEntities, useTableConfigs } from '@/data-access-layer';
import { LoadingIcon, SortableList } from '@/components';
import type { BaseEntity } from '@db/base-entity';
import {
  buildEntityPath,
  baseEntitySearchHint,
  type BaseEntityType,
} from '@domain';
import { tableConfigNotFoundError } from '@domain/table-config';
import { FCProps } from '@/types';

type Props = { entityType: BaseEntityType };

export const BaseEntitiesScreen: FCProps<Props> = ({ entityType }) => {
  const router = useRouter();
  const params = useParams({ strict: false });
  const adventureId = params.adventureId ?? '';

  const {
    baseEntities,
    loading: baseEntitiesLoading,
    createBaseEntity,
  } = useBaseEntities(entityType, adventureId);
  const { tableConfigs, loading: configsLoading } = useTableConfigs();

  const baseEntitiesTableConfig = tableConfigs.find(
    (c) => c.table_name === entityType,
  );

  const handleBaseEntityCreation = async () => {
    const newBaseEntityId = await createBaseEntity();
    void router.navigate({
      to: buildEntityPath(entityType, newBaseEntityId, adventureId),
    });
  };

  if (baseEntitiesLoading || configsLoading) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  if (!baseEntitiesTableConfig) {
    throw tableConfigNotFoundError(entityType);
  }

  return (
    <SortableList<BaseEntity>
      tableConfigId={baseEntitiesTableConfig.id}
      items={baseEntities}
      onRowClick={(baseEntity) => {
        void router.navigate({
          to: buildEntityPath(entityType, baseEntity.id, adventureId),
        });
      }}
      onCreateNew={() => {
        void handleBaseEntityCreation();
      }}
      searchPlaceholder={`e.g. "name, ${baseEntitySearchHint(entityType)}, some text in description"`}
    />
  );
};
