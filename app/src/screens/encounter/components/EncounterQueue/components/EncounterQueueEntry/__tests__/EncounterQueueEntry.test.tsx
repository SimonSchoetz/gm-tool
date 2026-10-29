import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EncounterQueueEntry } from '../EncounterQueueEntry';

vi.mock('../../../../EncounterEntityImage/EncounterEntityImage', () => ({
  EncounterEntityImage: () => null,
}));

describe('EncounterQueueEntry', () => {
  it('reports its own id once when it is clicked', async () => {
    const onSelect = vi.fn();
    const user = userEvent.setup();
    render(
      <EncounterQueueEntry
        id='item-7'
        name='Goblin'
        imageId={null}
        maxHp={null}
        currentHp={null}
        tempHp={0}
        defeated={false}
        selected={false}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByText('Goblin'));

    expect(onSelect.mock.calls).toEqual([['item-7']]);
  });
});
