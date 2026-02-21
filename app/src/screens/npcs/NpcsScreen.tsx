import { useParams, useRouter } from '@tanstack/react-router';
import { useNpcs } from '@/providers/npcs';
import { Routes } from '@/routes';
import { SortableList } from '@/components';
import type { Npc } from '@db/npc';
import './NpcsScreen.css';

export const NpcsScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: `/${Routes.ADVENTURE}/$adventureId/${Routes.NPCS}`,
  });

  const { npcs, loading, createNpc } = useNpcs(adventureId);

  const handleNpcCreation = async () => {
    const newNpcId = await createNpc(adventureId);
    router.navigate({
      to: `/${Routes.ADVENTURE}/${adventureId}/${Routes.NPC}/${newNpcId}`,
    });
  };

  if (loading) {
    return <div className='content-center'>Loading...</div>;
  }

  return (
    <SortableList<Npc>
      tableName='npcs'
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
