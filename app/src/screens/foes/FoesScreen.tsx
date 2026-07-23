import { useParams, useRouter } from '@tanstack/react-router';
import { useFoes, useTableConfigs } from '@/data-access-layer';
import { LoadingIcon, SortableList } from '@/components';
import type { Foe } from '@db/foe';
import { tableConfigNotFoundError } from '@domain/table-config';
import './FoesScreen.css';

export const FoesScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/foes',
  });

  const { foes, loading: foesLoading, createFoe } = useFoes(adventureId);
  const { tableConfigs, loading: configsLoading } = useTableConfigs();

  const foesTableConfig = tableConfigs.find((c) => c.table_name === 'foes');

  const handleFoeCreation = async () => {
    const newFoeId = await createFoe();
    void router.navigate({ to: `/adventure/${adventureId}/foe/${newFoeId}` });
  };

  if (foesLoading || configsLoading) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  if (!foesTableConfig) {
    throw tableConfigNotFoundError('foes');
  }

  return (
    <SortableList<Foe>
      tableConfigId={foesTableConfig.id}
      items={foes}
      onRowClick={(foe) => {
        void router.navigate({ to: `/adventure/${adventureId}/foe/${foe.id}` });
      }}
      onCreateNew={() => {
        void handleFoeCreation();
      }}
      searchPlaceholder='e.g. "name, type, some text in description"'
    />
  );
};
