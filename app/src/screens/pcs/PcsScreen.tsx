import { useParams, useRouter } from '@tanstack/react-router';
import { usePcs, useTableConfigs } from '@/data-access-layer';
import { LoadingIcon, SortableList } from '@/components';
import type { Pc } from '@db/pc';
import { buildEntityPath } from '@domain';
import { tableConfigNotFoundError } from '@domain/table-config';

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
    void router.navigate({ to: buildEntityPath('pcs', newPcId, adventureId) });
  };

  if (pcsLoading || configsLoading) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  if (!pcsTableConfig) {
    throw tableConfigNotFoundError('pcs');
  }

  return (
    <SortableList<Pc>
      tableConfigId={pcsTableConfig.id}
      items={pcs}
      onRowClick={(pc) => {
        void router.navigate({
          to: buildEntityPath('pcs', pc.id, adventureId),
        });
      }}
      onCreateNew={() => {
        void handlePcCreation();
      }}
      searchPlaceholder='e.g. "name, faction, some text in description"'
    />
  );
};
