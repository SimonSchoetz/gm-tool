import { Link, useParams, useRouter } from '@tanstack/react-router';
import { useNpcs } from '@/providers/npcs';
import { Routes } from '@/routes';
import {
  CustomScrollArea,
  GlassPanel,
  ImageById,
  ImagePlaceholderFrame,
  NewItemBtn,
  SortableTableHeader,
} from '@/components';
import { UserSquareIcon } from 'lucide-react';
import type { Npc } from '@db/npc';
import { useSortable } from '@/hooks/useSortable';
import './NpcsScreen.css';

const NPC_COLUMNS = [
  { key: 'image_id' as const, label: 'Avatar', sortable: false },
  { key: 'name' as const, label: 'Name' },
  { key: 'created_at' as const, label: 'Created At' },
  { key: 'updated_at' as const, label: 'Last updated' },
];

const NPC_SORT_COLUMNS = [
  { key: 'name' as const },
  { key: 'created_at' as const },
  { key: 'updated_at' as const },
];

export const NpcsScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/npcs',
  });

  const { npcs, loading, createNpc } = useNpcs(adventureId);

  const { sortedItems, sortState, toggleSort } = useSortable<Npc>(npcs, {
    defaultSort: { column: 'name', direction: 'asc' },
    columns: NPC_SORT_COLUMNS,
  });

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
    <GlassPanel className='npcs-screen'>
      <SortableTableHeader<Npc>
        columns={NPC_COLUMNS}
        sortState={sortState}
        onSort={toggleSort}
        className='npc-table-head'
      />
      <CustomScrollArea>
        <ul className='npc-table'>
          <li key='new-item-button'>
            <NewItemBtn
              type='list-item'
              label='+'
              onClick={handleNpcCreation}
            />
          </li>
          {sortedItems.map((npc) => (
            <ListItem key={npc.id} npc={npc} adventureId={adventureId} />
          ))}
        </ul>
      </CustomScrollArea>
    </GlassPanel>
  );
};

type ListItemProps = {
  npc: Npc;
  adventureId: string;
};

const ListItem = ({ npc, adventureId }: ListItemProps) => {
  const createdAt =
    npc.created_at && new Date(npc.created_at).toLocaleDateString();
  const updatedAt =
    npc.updated_at && new Date(npc.updated_at).toLocaleDateString();

  const route = `/${Routes.ADVENTURE}/${adventureId}/${Routes.NPC}/${npc.id}`;

  return (
    <li>
      <GlassPanel intensity='bright'>
        <Link className='npc-link-wrapper' to={route}>
          <ul className='npc-list-item'>
            <li>
              <AvatarFrame imageId={npc.image_id} />
            </li>
            <li>{npc.name}</li>
            <li>{createdAt}</li>
            <li>{updatedAt}</li>
          </ul>
        </Link>
      </GlassPanel>
    </li>
  );
};

const AvatarFrame = ({ imageId }: { imageId?: string | null }) => {
  return (
    <ImagePlaceholderFrame
      dimensions={{ width: '100px', height: '100px' }}
      radius='lg'
    >
      {imageId ? (
        <ImageById imageId={imageId || ''} className='npc-list-item-image' />
      ) : (
        <UserSquareIcon className='npc-placeholder-icon' />
      )}
    </ImagePlaceholderFrame>
  );
};
