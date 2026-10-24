import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FiveEStatBlockTextField } from '../FiveEStatBlockTextField';

describe('FiveEStatBlockTextField', () => {
  it('saves the typed text under the field key without trimming a trailing space', async () => {
    const saveField = vi.fn();
    render(
      <FiveEStatBlockTextField
        saveField={saveField}
        field='speed'
        label='Speed:'
        placeholder='30, Fly 60'
        savedValue=''
        readOnly={false}
      />,
    );

    await userEvent.setup().type(screen.getByLabelText('Speed:'), '30 ');

    expect(saveField).toHaveBeenLastCalledWith('speed', '30 ');
  });

  // [DEFERRED-VIOLATION: app/src/CLAUDE.md — Testing Policy, Forbidden bullet "React components" — `pnpm run mutation-check` leaves the component's `if (isHiddenTextField(...)) return null` unkilled without a component test of a render-time outcome
  it('renders nothing, label included, for a read-only field with blank text', () => {
    render(
      <FiveEStatBlockTextField
        saveField={vi.fn()}
        field='speed'
        label='Speed:'
        placeholder='30, Fly 60'
        savedValue='  '
        readOnly={true}
      />,
    );

    expect(screen.queryByText('Speed:')).not.toBeInTheDocument();
  });
});
