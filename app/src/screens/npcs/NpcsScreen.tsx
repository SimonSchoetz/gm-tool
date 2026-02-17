import { useState, useCallback } from 'react';
import { Link, useParams, useRouter } from '@tanstack/react-router';
import { useNpcs } from '@/providers/npcs';
import { Routes } from '@/routes';
import {
  CustomScrollArea,
  GlassPanel,
  ImageById,
  ImagePlaceholderFrame,
  NewItemBtn,
  SearchInput,
  SortableTableHeader,
} from '@/components';
import { UserSquareIcon } from 'lucide-react';
import type { Npc } from '@db/npc';
import { useSortable } from '@/hooks/useSortable';
import { useListFilter } from '@/hooks/useListFilter';
import './NpcsScreen.css';

const TABLE_HEAD_COLUMNS = [
  { key: 'image_id' as const, label: 'Avatar', sortable: false },
  { key: 'name' as const, label: 'Name' },
  { key: 'created_at' as const, label: 'Created At' },
  { key: 'updated_at' as const, label: 'Last updated' },
];

const SORT_COLUMNS = [
  { key: 'name' as const },
  { key: 'created_at' as const },
  { key: 'updated_at' as const },
];

const SEARCHABLE_COLUMNS = ['name', 'summary', 'description'];

export const NpcsScreen = () => {
  const router = useRouter();
  const { adventureId } = useParams({
    from: `/${Routes.ADVENTURE}/$adventureId/${Routes.NPCS}`,
  });

  const { npcs, loading, createNpc } = useNpcs(adventureId);

  const [searchTerm, setSearchTerm] = useState('');
  const handleSearch = useCallback((term: string) => setSearchTerm(term), []);

  const { nameMatches, fieldMatches } = useListFilter<Npc>(
    npcs,
    searchTerm,
    { searchableColumns: SEARCHABLE_COLUMNS }
  );

  const sortConfig = {
    defaultSort: { column: 'name' as const, direction: 'asc' as const },
    columns: SORT_COLUMNS,
  };

  const { sortedItems: sortedNameMatches, sortState, toggleSort } =
    useSortable<Npc>(nameMatches, sortConfig);

  const { sortedItems: sortedFieldMatches } =
    useSortable<Npc>(fieldMatches, sortConfig);

  const handleNpcCreation = async () => {
    const newNpcId = await createNpc(adventureId);
    router.navigate({
      to: `/${Routes.ADVENTURE}/${adventureId}/${Routes.NPC}/${newNpcId}`,
    });
  };

  if (loading) {
    return <div className='content-center'>Loading...</div>;
  }

  const isSearching = searchTerm.trim().length > 0;
  const hasFieldMatches = sortedFieldMatches.length > 0;

  return (
    <GlassPanel className='npcs-screen'>
      <SearchInput onSearch={handleSearch} placeholder='Search NPCs...' />
      <SortableTableHeader<Npc>
        columns={TABLE_HEAD_COLUMNS}
        sortState={sortState}
        onSort={toggleSort}
        className='npc-table-head'
      />
      <CustomScrollArea>
        <ul className='npc-table'>
          {!isSearching && (
            <li key='new-item-button'>
              <NewItemBtn
                type='list-item'
                label='+'
                onClick={handleNpcCreation}
              />
            </li>
          )}
          {sortedNameMatches.map((npc) => (
            <ListItem key={npc.id} npc={npc} adventureId={adventureId} />
          ))}
          {isSearching && hasFieldMatches && (
            <>
              <li className='npc-field-matches-divider'>
                <span className='npc-field-matches-label'>
                  Found in other fields
                </span>
              </li>
              {sortedFieldMatches.map((npc) => (
                <ListItem key={npc.id} npc={npc} adventureId={adventureId} />
              ))}
            </>
          )}
          {isSearching &&
            sortedNameMatches.length === 0 &&
            sortedFieldMatches.length === 0 && (
              <li className='npc-no-results'>No NPCs found</li>
            )}
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
