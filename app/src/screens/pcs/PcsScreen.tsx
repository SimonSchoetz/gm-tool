import { useParams, useRouter } from '@tanstack/react-router';
import { usePcs, useTableConfigs } from '@/data-access-layer';
import { SortableList } from '@/components';
import type { Pc } from '@db/pc';
import { tableConfigNotFoundError } from '@domain/table-config';
import './PcsScreen.css';

export const PcsScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/pcs',
  });

  const { pcs, loading: pcsLoading, createPc } = usePcs(adventureId);
  const { tableConfigs, loading: configsLoading } = useTableConfigs();

  const pcsTableConfig = tableConfigs.find((c) => c.table_name === 'pcs');

  const handlePcCreation = async () => {
    const newPcId = await createPc();
    void router.navigate({ to: `/adventure/${adventureId}/pc/${newPcId}` });
  };

  if (pcsLoading || configsLoading) {
    return <div className='content-center'>Loading...</div>;
  }

  if (!pcsTableConfig) {
    throw tableConfigNotFoundError('pcs');
  }

  return (
    <SortableList<Pc>
      tableConfigId={pcsTableConfig.id}
      items={pcs}
      onRowClick={(pc) => {
        void router.navigate({ to: `/adventure/${adventureId}/pc/${pc.id}` });
      }}
      onCreateNew={() => {
        void handlePcCreation();
      }}
      searchPlaceholder='e.g. "name, faction, some text in description"'
    />
  );
};
