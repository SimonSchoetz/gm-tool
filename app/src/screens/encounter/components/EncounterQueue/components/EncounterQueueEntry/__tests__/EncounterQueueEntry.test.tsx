import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SelectionModifiers } from '../../../../../helper/applySelectionClick';
import { EncounterQueueEntry } from '../EncounterQueueEntry';

type HpProps = { maxHp: number | null; currentHp: number | null };

const renderEntry = ({
  maxHp = null,
  currentHp = null,
  defeated = false,
  selected = false,
  otherDraggedCount = 0,
  onSelect = vi.fn(),
}: Partial<HpProps> & {
  defeated?: boolean;
  selected?: boolean;
  otherDraggedCount?: number;
  onSelect?: (id: string, modifiers: SelectionModifiers) => void;
} = {}) =>
  render(
    <EncounterQueueEntry
      kind='combatant'
      id='item-7'
      name='Goblin'
      imageId={null}
      maxHp={maxHp}
      currentHp={currentHp}
      tempHp={0}
      defeated={defeated}
      selected={selected}
      otherDraggedCount={otherDraggedCount}
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
  screen.getByText('Goblin').closest('[aria-current="true"]') !== null;

describe('EncounterQueueEntry', () => {
  it('reports its own id once with no modifiers on a plain click', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    renderEntry({ onSelect });

    await user.click(screen.getByText('Goblin'));

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
      renderEntry({ onSelect });

      await user.keyboard(keys);
      await user.click(screen.getByText('Goblin'));

      expect(onSelect.mock.calls).toEqual([['item-7', modifiers]]);
    },
  );

  it('shows how many other entries travel with it only when that count is above 0', () => {
    const { unmount } = renderEntry({ otherDraggedCount: 3 });
    expect(screen.getByText('+3')).toBeInTheDocument();
    unmount();

    renderEntry({ otherDraggedCount: 0 });
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it('is marked as the current item after a click and not before', async () => {
    const user = userEvent.setup();
    render(<StatefulEntry />);

    expect(isCurrent()).toBe(false);

    await user.click(screen.getByText('Goblin'));

    expect(isCurrent()).toBe(true);
  });

  it.each([
    ['is defeated at hurt HP', { maxHp: 10, currentHp: 4, defeated: true }],
    ['is defeated with no HP set', { defeated: true }],
    ['is not defeated and down at 0 HP', { maxHp: 10, currentHp: 0 }],
  ])(
    'shows a greyed-out image and no damage tint when it %s',
    (_case, props) => {
      renderEntry(props);

      expect(screen.getByLabelText('Greyed-out image')).toBeInTheDocument();
      expect(screen.queryByLabelText('Damage tint')).not.toBeInTheDocument();
    },
  );

  it('shows the damage tint and no greyed-out image when it is hurt and not defeated', () => {
    renderEntry({ maxHp: 10, currentHp: 4 });

    expect(screen.getByLabelText('Damage tint')).toBeInTheDocument();
    expect(screen.queryByLabelText('Greyed-out image')).not.toBeInTheDocument();
  });

  it('shows neither the tint nor the greyed-out image at full HP or with no HP set', () => {
    const { unmount } = renderEntry({ maxHp: 10, currentHp: 10 });
    expect(screen.queryByLabelText('Damage tint')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Greyed-out image')).not.toBeInTheDocument();
    unmount();

    renderEntry();
    expect(screen.queryByLabelText('Damage tint')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Greyed-out image')).not.toBeInTheDocument();
  });

  describe('an event entry', () => {
    const renderEvent = (onSelect = vi.fn()) =>
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

    it('shows its name and the event icon tile and no HP text, damage tint or greyed-out image', () => {
      renderEvent();

      expect(screen.getByText('Lair action')).toBeInTheDocument();
      expect(screen.getByLabelText('Event icon')).toBeInTheDocument();
      expect(screen.queryByText(/\//)).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Damage tint')).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText('Greyed-out image'),
      ).not.toBeInTheDocument();
    });

    it('reports its own id with the modifiers of a click', async () => {
      const onSelect = vi.fn();
      const user = userEvent.setup();
      renderEvent(onSelect);

      await user.keyboard('{Shift>}');
      await user.click(screen.getByText('Lair action'));

      expect(onSelect.mock.calls).toEqual([
        ['event-1', { shift: true, toggle: false }],
      ]);
    });
  });

  it('shows no event icon for a combatant entry', () => {
    renderEntry();

    expect(screen.queryByLabelText('Event icon')).not.toBeInTheDocument();
  });
});
