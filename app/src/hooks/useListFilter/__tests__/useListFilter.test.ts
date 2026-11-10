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

  it('lists an item as a name match when its name holds a later term and another column holds the first one', () => {
    const { nameMatches, fieldMatches } = filterBy('raid, chief');

    expect(nameMatches).toEqual([GOBLIN_CHIEF]);
    expect(fieldMatches).not.toContain(GOBLIN_CHIEF);
  });

  it('lists an item as a field match when its terms are found in different other columns', () => {
    const rows = [
      { id: 'zed', name: 'Zed', notes: 'leads the raid', role: 'goblin' },
      { id: 'elf', name: 'Elf', notes: 'peaceful', role: 'archer' },
    ];

    const { nameMatches, fieldMatches } = renderHook(() =>
      useListFilter(rows, 'goblin, raid', {
        searchableColumns: ['name', 'notes', 'role'],
      }),
    ).result.current;

    expect(nameMatches).toEqual([]);
    expect(fieldMatches).toEqual([rows[0]]);
  });

  it('lists an item that matches in one of two other columns as a field match', () => {
    const rows = [
      { id: 'zed', name: 'Zed', notes: 'allied with a goblin', role: 'scout' },
    ];

    const { fieldMatches } = renderHook(() =>
      useListFilter(rows, 'goblin', {
        searchableColumns: ['name', 'notes', 'role'],
      }),
    ).result.current;

    expect(fieldMatches).toEqual(rows);
  });

  it('skips a searchable column whose value is no text when looking for a field match', () => {
    const rows = [
      { id: 'zed', name: 'Zed', notes: null, role: 'goblin scout' },
    ];

    const { fieldMatches } = renderHook(() =>
      useListFilter(rows, 'goblin', {
        searchableColumns: ['name', 'notes', 'role'],
      }),
    ).result.current;

    expect(fieldMatches).toEqual(rows);
  });

  it('treats an item without a text name as having no name, so it can only match in other columns', () => {
    const rows = [{ id: 'anon', name: null, notes: 'camps here' }];

    const { nameMatches, fieldMatches } = renderHook(() =>
      useListFilter(rows, 'here', { searchableColumns: ['name', 'notes'] }),
    ).result.current;

    expect(nameMatches).toEqual([]);
    expect(fieldMatches).toEqual(rows);
  });
});
