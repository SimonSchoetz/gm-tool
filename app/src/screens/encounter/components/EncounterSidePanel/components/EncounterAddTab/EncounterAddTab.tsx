import { useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { BASE_ENTITY_TYPES, entityTypeLabel } from '@domain';
import { Checkbox } from '@/components/Checkbox/Checkbox';
import { LoadingIcon } from '@/components/LoadingIcon/LoadingIcon';
import { SearchInput } from '@/components/SearchInput/SearchInput';
import { useAdventureBaseEntities, useSetting } from '@/data-access-layer';
import { useListFilter } from '@/hooks/useListFilter';
import { EncounterAddRow } from './components/EncounterAddRow/EncounterAddRow';
import { filterByEntityTypes } from './helper/filterByEntityTypes';
import { sortEntitiesByName } from './helper/sortEntitiesByName';
import { toggleEntityType } from './helper/toggleEntityType';
import './EncounterAddTab.css';

const FILTER_CONFIG: { searchableColumns: ('name' | 'description')[] } = {
  searchableColumns: ['name', 'description'],
};

export const EncounterAddTab = () => {
  const { adventureId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { baseEntities, loading } = useAdventureBaseEntities(adventureId);
  const { value: filter, update: updateFilter } =
    useSetting('encounterAddFilter');
  const [searchTerm, setSearchTerm] = useState('');

  const selectedTypes = filter?.entity_types ?? [];
  const { nameMatches, fieldMatches } = useListFilter(
    filterByEntityTypes(sortEntitiesByName(baseEntities), selectedTypes),
    searchTerm,
    FILTER_CONFIG,
  );

  if (loading) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  const visibleEntities = [...nameMatches, ...fieldMatches];

  return (
    <div className='encounter-add-tab'>
      <div className='encounter-add-tab-type-filter'>
        {BASE_ENTITY_TYPES.map((entityType) => {
          const checkboxId = `encounter-add-type-${entityType}`;
          return (
            <div key={entityType} className='encounter-add-tab-type'>
              <Checkbox
                id={checkboxId}
                checked={selectedTypes.includes(entityType)}
                onChange={() => {
                  updateFilter({
                    entity_types: toggleEntityType(selectedTypes, entityType),
                  });
                }}
              />
              <label htmlFor={checkboxId}>{entityTypeLabel(entityType)}</label>
            </div>
          );
        })}
      </div>

      <SearchInput onSearch={setSearchTerm} placeholder='Search entities...' />

      {baseEntities.length === 0 ? (
        <p>This adventure has no entities yet.</p>
      ) : (
        <ul className='encounter-add-tab-list'>
          {visibleEntities.length === 0 ? (
            <li>No results found</li>
          ) : (
            visibleEntities.map((baseEntity) => (
              <EncounterAddRow key={baseEntity.id} baseEntity={baseEntity} />
            ))
          )}
        </ul>
      )}
    </div>
  );
};
