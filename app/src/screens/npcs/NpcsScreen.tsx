import { useParams, useRouter } from '@tanstack/react-router';
import { useNpcs } from '@/data-access-layer/npcs';
import { useTableConfigs } from '@/data-access-layer/table-config';
import { Routes } from '@/routes';
import { SortableList } from '@/components';
import type { Npc } from '@db/npc';
import './NpcsScreen.css';

export const NpcsScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: `/${Routes.ADVENTURE}/$adventureId/${Routes.NPCS}`,
  });

  const { npcs, loading: npcsLoading, createNpc } = useNpcs(adventureId);
  const { tableConfigs, loading: configsLoading } = useTableConfigs();

  const npcsTableConfig = tableConfigs.find((c) => c.table_name === 'npcs');

  const handleNpcCreation = async () => {
    const newNpcId = await createNpc(adventureId);
    router.navigate({
      to: `/${Routes.ADVENTURE}/${adventureId}/${Routes.NPC}/${newNpcId}`,
    });
  };

  if (npcsLoading || configsLoading || !npcsTableConfig) {
    return <div className='content-center'>Loading...</div>;
  }

  return (
    <SortableList<Npc>
      tableConfigId={npcsTableConfig.id}
      items={npcs}
      onRowClick={(npc) =>
        router.navigate({
          to: `/${Routes.ADVENTURE}/${adventureId}/${Routes.NPC}/${npc.id}`,
        })
      }
      onCreateNew={handleNpcCreation}
      searchPlaceholder='e.g. "name, profession, some text in description"'
    />
  );
};
