import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useListFilter } from '../useListFilter';

type Row = { id: string; name: string; notes: string };

const HOBGOBLIN: Row = { id: 'hob', name: 'Hobgoblin', notes: '' };
const GOBLIN_CHIEF: Row = {
  id: 'chief',
  name: 'Goblin Chief',
  notes: 'leads the raid',
};
const ORC: Row = { id: 'orc', name: 'Orc', notes: 'allied with a goblin' };
const ELF: Row = { id: 'elf', name: 'Elf', notes: 'peaceful' };

const ITEMS = [HOBGOBLIN, GOBLIN_CHIEF, ORC, ELF];
const CONFIG = {
  searchableColumns: ['name', 'notes'] as (keyof Row)[],
};

const filterBy = (searchTerm: string) =>
  renderHook(() => useListFilter(ITEMS, searchTerm, CONFIG)).result.current;

describe('useListFilter', () => {
  it('returns every item as a name match when the search term is blank', () => {
    expect(filterBy('  ,  ')).toEqual({ nameMatches: ITEMS, fieldMatches: [] });
  });

  it('lists names starting with the term before names that merely contain it', () => {
    const { nameMatches } = filterBy('goblin');

    expect(nameMatches).toEqual([GOBLIN_CHIEF, HOBGOBLIN]);
  });

  it('lists an item matching only in another column as a field match', () => {
    const { nameMatches, fieldMatches } = filterBy('goblin');

    expect(fieldMatches).toEqual([ORC]);
    expect(nameMatches).not.toContain(ORC);
  });

  it('leaves out items that match in no searchable column', () => {
    const { nameMatches, fieldMatches } = filterBy('goblin');

    expect([...nameMatches, ...fieldMatches]).not.toContain(ELF);
  });

  it('requires every comma-separated term to match somewhere in the item', () => {
    const { nameMatches, fieldMatches } = filterBy('goblin, raid');

    expect(nameMatches).toEqual([GOBLIN_CHIEF]);
    expect(fieldMatches).toEqual([]);
  });

  it('matches case-insensitively', () => {
    expect(filterBy('GOBLIN').nameMatches).toEqual([GOBLIN_CHIEF, HOBGOBLIN]);
  });
});
