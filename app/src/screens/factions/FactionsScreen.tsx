import { useParams, useRouter } from '@tanstack/react-router';
import { useFactions, useTableConfigs } from '@/data-access-layer';
import { SortableList } from '@/components';
import type { Faction } from '@db/faction';
import { tableConfigNotFoundError } from '@domain/table-config';
import './FactionsScreen.css';

export const FactionsScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/factions',
  });

  const {
    factions,
    loading: factionsLoading,
    createFaction,
  } = useFactions(adventureId);
  const { tableConfigs, loading: configsLoading } = useTableConfigs();

  const factionsTableConfig = tableConfigs.find(
    (c) => c.table_name === 'factions',
  );

  const handleFactionCreation = async () => {
    const newFactionId = await createFaction();
    void router.navigate({
      to: `/adventure/${adventureId}/faction/${newFactionId}`,
    });
  };

  if (factionsLoading || configsLoading) {
    return <div className='content-center'>Loading...</div>;
  }

  if (!factionsTableConfig) {
    throw tableConfigNotFoundError('factions');
  }

  return (
    <SortableList<Faction>
      tableConfigId={factionsTableConfig.id}
      items={factions}
      onRowClick={(faction) => {
        void router.navigate({
          to: `/adventure/${adventureId}/faction/${faction.id}`,
        });
      }}
      onCreateNew={() => {
        void handleFactionCreation();
      }}
      searchPlaceholder='e.g. "name, leader, some text in description"'
    />
  );
};
