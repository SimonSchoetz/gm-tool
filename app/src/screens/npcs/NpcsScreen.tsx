import { Link, useParams } from '@tanstack/react-router';
import { useAdventures } from '@/data/adventures';
import { useEffect, useState } from 'react';
import { Routes } from '@/routes';
import {
  ActionContainer,
  CustomScrollArea,
  GlassPanel,
  NewItemBtn,
} from '@/components';
import { ChevronDownIcon } from 'lucide-react';
import './NpcsScreen.css';

export const NpcsScreen = () => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/npcs',
  });

  const { loadAdventure, adventure } = useAdventures();

  useEffect(() => {
    //get npcs by adventureID
    if (adventureId) {
      loadAdventure(adventureId);
    }
  }, [adventureId]);

  return (
    <GlassPanel className='npcs-screen'>
      <TableHeadRow />
      <CustomScrollArea>
        <ul className='npc-table'>
          <NewNPCButton />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
          <ListItem />
        </ul>
      </CustomScrollArea>
    </GlassPanel>
  );
};

const NewNPCButton = () => {
  return (
    <NewItemBtn
      type='list-item'
      label='+'
      onClick={() => console.log('new NPC clicked')}
      className='new-npc-btn'
    />
  );
};

const TableHeadRow = () => {
  const [sortBy, setSortBy] = useState<string>('name');
  return (
    <li className='table-head'>
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
    </li>
  );
};

const ListItem = () => {
  return (
    <li>
      <GlassPanel intensity='bright'>
        <Link
          className='npc-list-item'
          to={`${Routes.ADVENTURES}` /* Will route to NPC screen */}
        >
          <div>Image or Placeholder</div>
          <div>PC Name</div>
          <div>Faction they belong to</div>
          <div>When they were created</div>
          <div>When they have been last updated</div>
        </Link>
      </GlassPanel>
    </li>
  );
};
