import { Link, useParams, useRouter } from '@tanstack/react-router';
import { useNpcs } from '@/providers/npcs';
import { useEffect, useState } from 'react';
import { Routes } from '@/routes';
import {
  ActionContainer,
  CustomScrollArea,
  GlassPanel,
  NewItemBtn,
} from '@/components';
import { ChevronDownIcon } from 'lucide-react';
import type { Npc } from '@db/npc';
import './NpcsScreen.css';

export const NpcsScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/npcs',
  });

  const { initNpcs, npcs, loading, createNpc } = useNpcs();

  useEffect(() => {
    if (adventureId) {
      initNpcs(adventureId);
    }
  }, [adventureId, initNpcs]);

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
      <ActionContainer onClick={() => setSortBy('name')} label='Sort by name'>
        Name {sortBy === 'name' && <ChevronDownIcon />}
      </ActionContainer>
      <ActionContainer
        onClick={() => setSortBy('faction')}
        label='Sort by faction'
      >
        Faction {sortBy === 'faction' && <ChevronDownIcon />}
      </ActionContainer>
      <ActionContainer
        onClick={() => setSortBy('createdAt')}
        label='Sort by creation date'
      >
        Created At {sortBy === 'createdAt' && <ChevronDownIcon />}
      </ActionContainer>
      <ActionContainer
        onClick={() => setSortBy('lastUpdated')}
        label='Sort by last updated'
      >
        Last updated {sortBy === 'lastUpdated' && <ChevronDownIcon />}
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
        <Link className='npc-list-item' to={route}>
          <div>{npc.image_id ? 'Image' : 'No Image'}</div>
          <div>{npc.name}</div>
          <div>{npc.faction || '-'}</div>
          <div>{createdAt}</div>
          <div>{updatedAt}</div>
        </Link>
      </GlassPanel>
    </li>
  );
};
