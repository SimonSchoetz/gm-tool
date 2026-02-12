import { Link, useParams, useRouter } from '@tanstack/react-router';
import { useNpcs } from '@/providers/npcs';
import { Routes } from '@/routes';
import {
  ActionContainer,
  CustomScrollArea,
  GlassPanel,
  ImageById,
  NewItemBtn,
} from '@/components';
import { ChevronDownIcon, UserSquareIcon } from 'lucide-react';
import type { Npc } from '@db/npc';
import './NpcsScreen.css';
import { useState } from 'react';

export const NpcsScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/npcs',
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
    <GlassPanel className='npcs-screen'>
      <TableHeadRow />
      <CustomScrollArea>
        <ul className='npc-table'>
          <li key='new-item-button'>
            <NewItemBtn
              type='list-item'
              label='+'
              onClick={handleNpcCreation}
            />
          </li>
          {npcs.map((npc) => (
            <ListItem key={npc.id} npc={npc} adventureId={adventureId} />
          ))}
        </ul>
      </CustomScrollArea>
    </GlassPanel>
  );
};

const TableHeadRow = () => {
  const [sortBy, setSortBy] = useState<string>('name');
  return (
    <div className='table-head'>
      <div>Avatar</div>
      <ActionContainer
        className='npc-table-head-item'
        onClick={() => setSortBy('name')}
        label='Sort by name'
      >
        <span>Name</span>
        {sortBy === 'name' && <ChevronDownIcon />}
      </ActionContainer>

      <ActionContainer
        className='npc-table-head-item'
        onClick={() => setSortBy('createdAt')}
        label='Sort by creation date'
      >
        <span>Created At</span>
        {sortBy === 'createdAt' && <ChevronDownIcon />}
      </ActionContainer>

      <ActionContainer
        className='npc-table-head-item'
        onClick={() => setSortBy('lastUpdated')}
        label='Sort by last updated'
      >
        <span>Last updated</span>
        {sortBy === 'lastUpdated' && <ChevronDownIcon />}
      </ActionContainer>
    </div>
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
    <GlassPanel radius='lg' className='list-item-avatar-frame'>
      {imageId ? (
        <ImageById imageId={imageId || ''} />
      ) : (
        <UserSquareIcon className='npc-placeholder-icon' />
      )}
    </GlassPanel>
  );
};
