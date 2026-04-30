import { useParams, useRouter } from '@tanstack/react-router';
import { useNpcs, useTableConfigs } from '@/data-access-layer';
import { SortableList } from '@/components';
import type { Npc } from '@db/npc';
import './NpcsScreen.css';

export const NpcsScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/npcs',
  });

  const { npcs, loading: npcsLoading, createNpc } = useNpcs(adventureId);
  const { tableConfigs, loading: configsLoading } = useTableConfigs();

  const npcsTableConfig = tableConfigs.find((c) => c.table_name === 'npcs');

  const handleNpcCreation = async () => {
    const newNpcId = await createNpc();
    void router.navigate({ to: `/adventure/${adventureId}/npc/${newNpcId}` });
  };

  if (npcsLoading || configsLoading || !npcsTableConfig) {
    return <div className='content-center'>Loading...</div>;
  }

  return (
    <SortableList<Npc>
      tableConfigId={npcsTableConfig.id}
      items={npcs}
      onRowClick={(npc) => {
        void router.navigate({ to: `/adventure/${adventureId}/npc/${npc.id}` });
      }}
      onCreateNew={() => {
        void handleNpcCreation();
      }}
      searchPlaceholder='e.g. "name, profession, some text in description"'
    />
  );
};
