import { useParams, useRouter } from '@tanstack/react-router';
import { useNpcs } from '@/providers/npcs';
import { Routes } from '@/routes';
import { SortableList, type ListColumn } from '@/components';
import type { Npc } from '@db/npc';
import './NpcsScreen.css';

const COLUMNS: ListColumn<Npc>[] = [
  { key: 'image_id', label: 'Avatar', sortable: false },
  { key: 'name', label: 'Name' },
  { key: 'created_at', label: 'Created At' },
  { key: 'updated_at', label: 'Last updated' },
];

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
      items={npcs}
      columns={COLUMNS}
      filterConfig={{ searchableColumns: ['name', 'summary', 'description'] }}
      defaultSortColumn='updated_at'
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
