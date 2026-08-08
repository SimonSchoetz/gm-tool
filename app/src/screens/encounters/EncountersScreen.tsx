import { useParams, useRouter } from '@tanstack/react-router';
import { useEncounters, useTableConfigs } from '@/data-access-layer';
import { LoadingIcon, SortableList } from '@/components';
import type { Encounter } from '@db/encounter';
import { buildEntityPath } from '@domain';
import { tableConfigNotFoundError } from '@domain/table-config';

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

  const encountersTableConfig = tableConfigs.find(
    (c) => c.table_name === 'encounters',
  );

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

  return (
    <SortableList<Encounter>
      tableConfigId={encountersTableConfig.id}
      items={encounters}
      onRowClick={(encounter) => {
        void router.navigate({
          to: buildEntityPath('encounters', encounter.id, adventureId),
        });
      }}
      onCreateNew={() => {
        void handleEncounterCreation();
      }}
      searchPlaceholder='e.g. "name, some text in description"'
    />
  );
};
