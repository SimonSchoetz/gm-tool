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
});
