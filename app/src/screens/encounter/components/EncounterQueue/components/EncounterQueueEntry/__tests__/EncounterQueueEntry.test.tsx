import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SelectionModifiers } from '../../../../../helper/applySelectionClick';
import { EncounterQueueEntry } from '../EncounterQueueEntry';

const renderEntry = (
  onSelect: (id: string, modifiers: SelectionModifiers) => void,
) =>
  render(
    <EncounterQueueEntry
      kind='combatant'
      id='item-7'
      name='Goblin'
      imageId={null}
      entity={null}
      maxHp={null}
      currentHp={null}
      tempHp={0}
      defeated={false}
      selected={false}
      otherDraggedCount={0}
      onSelect={onSelect}
    />,
  );

// Holds the selection the way the encounter screen does, since the entry only reports a click.
const StatefulEntry = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <EncounterQueueEntry
      kind='combatant'
      id='item-7'
      name='Goblin'
      imageId={null}
      entity={null}
      maxHp={null}
      currentHp={null}
      tempHp={0}
      defeated={false}
      selected={selectedId === 'item-7'}
      otherDraggedCount={0}
      onSelect={(id) => {
        setSelectedId(id);
      }}
    />
  );
};

const isCurrent = () =>
  screen.getByTitle('Goblin').closest('[aria-current="true"]') !== null;

describe('EncounterQueueEntry', () => {
  it('reports its own id once with no modifiers on a plain click', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderEntry(onSelect);

    await user.click(screen.getByTitle('Goblin'));

    expect(onSelect.mock.calls).toEqual([
      ['item-7', { shift: false, toggle: false }],
    ]);
  });

  it.each([
    ['a Shift-click', '{Shift>}', { shift: true, toggle: false }],
    ['a Meta-click', '{Meta>}', { shift: false, toggle: true }],
    ['a Ctrl-click', '{Control>}', { shift: false, toggle: true }],
    [
      'a Shift-click with Meta held',
      '{Shift>}{Meta>}',
      { shift: true, toggle: true },
    ],
  ])(
    'reports its own id once with the modifiers of %s',
    async (_case, keys, modifiers) => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      renderEntry(onSelect);

      await user.keyboard(keys);
      await user.click(screen.getByTitle('Goblin'));

      expect(onSelect.mock.calls).toEqual([['item-7', modifiers]]);
    },
  );

  it('is marked as the current item after a click and not before', async () => {
    const user = userEvent.setup();
    render(<StatefulEntry />);

    expect(isCurrent()).toBe(false);

    await user.click(screen.getByTitle('Goblin'));

    expect(isCurrent()).toBe(true);
  });

  it('reports the id of an event entry with the modifiers of a click', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <EncounterQueueEntry
        kind='event'
        id='event-1'
        name='Lair action'
        selected={false}
        otherDraggedCount={0}
        onSelect={onSelect}
      />,
    );

    await user.keyboard('{Shift>}');
    await user.click(screen.getByTitle('Lair action'));

    expect(onSelect.mock.calls).toEqual([
      ['event-1', { shift: true, toggle: false }],
    ]);
  });
});
