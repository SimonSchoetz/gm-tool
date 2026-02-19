import { useParams, useRouter } from '@tanstack/react-router';
import { useNpcs } from '@/providers/npcs';
import { Routes } from '@/routes';
import {
  ImageById,
  ImagePlaceholderFrame,
  SortableList,
  type ListColumn,
} from '@/components';
import { UserSquareIcon } from 'lucide-react';
import type { Npc } from '@db/npc';
import './NpcsScreen.css';

const COLUMNS: ListColumn<Npc>[] = [
  {
    key: 'image_id',
    label: 'Avatar',
    sortable: false,
    render: (npc) => <AvatarFrame imageId={npc.image_id} />,
  },
  { key: 'name', label: 'Name' },
  {
    key: 'created_at',
    label: 'Created At',
    render: (npc) =>
      npc.created_at ? new Date(npc.created_at).toLocaleDateString() : '',
  },
  {
    key: 'updated_at',
    label: 'Last updated',
    render: (npc) =>
      npc.updated_at ? new Date(npc.updated_at).toLocaleDateString() : '',
  },
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
      defaultSortColumn='name'
      onRowClick={(npc) =>
        router.navigate({
          to: `/${Routes.ADVENTURE}/${adventureId}/${Routes.NPC}/${npc.id}`,
        })
      }
      onCreateNew={handleNpcCreation}
      searchPlaceholder='Search NPCs...'
      className='npcs-screen'
    />
  );
};

const AvatarFrame = ({ imageId }: { imageId?: string | null }) => {
  return (
    <ImagePlaceholderFrame
      dimensions={{ width: '100px', height: '100px' }}
      radius='lg'
    >
      {imageId ? (
        <ImageById imageId={imageId} className='npc-list-item-image' />
      ) : (
        <UserSquareIcon className='npc-placeholder-icon' />
      )}
    </ImagePlaceholderFrame>
  );
};
