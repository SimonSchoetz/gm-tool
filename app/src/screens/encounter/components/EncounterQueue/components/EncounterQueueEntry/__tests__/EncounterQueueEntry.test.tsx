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
  onSelect = vi.fn(),
}: Partial<HpProps> & {
  defeated?: boolean;
  selected?: boolean;
  onSelect?: (id: string, modifiers: SelectionModifiers) => void;
} = {}) =>
  render(
    <EncounterQueueEntry
      id='item-7'
      name='Goblin'
      imageId={null}
      maxHp={maxHp}
      currentHp={currentHp}
      tempHp={0}
      defeated={defeated}
      selected={selected}
      onSelect={onSelect}
    />,
  );

// Holds the selection the way the encounter screen does, since the entry only reports a click.
const StatefulEntry = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  return (
    <EncounterQueueEntry
      id='item-7'
      name='Goblin'
      imageId={null}
      maxHp={null}
      currentHp={null}
      tempHp={0}
      defeated={false}
      selected={selectedId === 'item-7'}
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
});
