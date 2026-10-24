import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FiveEStatBlockNumberField } from '../FiveEStatBlockNumberField';

const renderField = (savedValue: number | null) => {
  const saveField = vi.fn();
  const fieldFor = (value: number | null) => (
    <FiveEStatBlockNumberField
      saveField={saveField}
      field='hp'
      placeholder='000'
      savedValue={value}
      readOnly={false}
    />
  );
  const { rerender } = render(fieldFor(savedValue));
  return {
    saveField,
    input: screen.getByRole('spinbutton'),
    showSaved: (value: number | null) => {
      rerender(fieldFor(value));
    },
  };
};

describe('FiveEStatBlockNumberField', () => {
  it('saves a typed whole number under the field key as a number', () => {
    const { saveField, input } = renderField(null);

    fireEvent.change(input, { target: { value: '12' } });

    expect(saveField).toHaveBeenCalledWith('hp', 12);
    expect(input).toHaveValue(12);
  });

  it('keeps a saved whole number on screen when the field loses focus', () => {
    const { input } = renderField(7);

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '12' } });
    fireEvent.blur(input);

    expect(screen.getByRole('spinbutton')).toHaveValue(12);
  });

  it('shows a value saved elsewhere once the field has lost focus', () => {
    const { input, showSaved } = renderField(7);

    fireEvent.focus(input);
    fireEvent.blur(input);
    showSaved(9);

    expect(screen.getByRole('spinbutton')).toHaveValue(9);
  });

  it('saves null when the field is cleared', async () => {
    const { saveField, input } = renderField(7);

    await userEvent.setup().clear(input);

    expect(saveField).toHaveBeenCalledWith('hp', null);
  });

  it('saves nothing for a decimal and shows the saved value again on blur', () => {
    const { saveField, input } = renderField(7);

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '1.5' } });
    expect(saveField).not.toHaveBeenCalled();
    fireEvent.blur(input);

    expect(screen.getByRole('spinbutton')).toHaveValue(7);
  });
});
