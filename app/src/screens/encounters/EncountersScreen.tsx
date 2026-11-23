import { useParams, useRouter } from '@tanstack/react-router';
import { useEncounters, useTableConfigs } from '@/data-access-layer';
import { LoadingIcon } from '@/components/LoadingIcon/LoadingIcon';
import { SortableList } from '@/components/SortableList';
import type { Encounter } from '@db/encounter';
import { buildEntityPath } from '@domain';
import { tableConfigNotFoundError } from '@domain/table-config';
import { ScreensEntityActions } from '../components/ScreensEntityActions';

export const EncountersScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/encounters',
  });

  const {
    encounters,
    loading: encountersLoading,
    createEncounter,
  } = useEncounters(adventureId);
  const { tableConfigs, loading: configsLoading } = useTableConfigs();

  const encountersTableConfig =
    tableConfigs.find((c) => c.table_name === 'encounters') ?? null;

  const handleEncounterCreation = async () => {
    const newEncounterId = await createEncounter();
    void router.navigate({
      to: buildEntityPath('encounters', newEncounterId, adventureId),
    });
  };

  if (encountersLoading || configsLoading) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  if (!encountersTableConfig) {
    throw tableConfigNotFoundError('encounters');
  }

  const onRowClick = (encounter: Encounter) => {
    void router.navigate({
      to: buildEntityPath('encounters', encounter.id, adventureId),
    });
  };

  const onCreateNew = () => {
    void handleEncounterCreation();
  };

  const renderRowActions = (itemId: string, closeMenu: () => void) => (
    <ScreensEntityActions
      entityType='encounters'
      entityId={itemId}
      adventureId={adventureId}
      afterDelete='stay'
      onChoose={closeMenu}
    />
  );

  return (
    <SortableList<Encounter>
      tableConfigId={encountersTableConfig.id}
      items={encounters}
      onRowClick={onRowClick}
      onCreateNew={onCreateNew}
      searchPlaceholder='e.g. "name, some text in description"'
      entityType='encounters'
      renderRowActions={renderRowActions}
    />
  );
};
