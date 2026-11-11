import { useState } from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useTypographicInput } from '../useTypographicInput';

const typed = (value: string, caret: number) =>
  ({
    target: { value, selectionStart: caret },
  }) as React.ChangeEvent<HTMLInputElement>;

// Holds the field's value in state the way every call site does, so each keystroke is judged against the value the field holds; `setValue` stands in for a change from outside the field, such as a synced edit.
const renderTypographicInput = (initialValue = '') => {
  const onValueChange = vi.fn();
  const rendered = renderHook(() => {
    const [value, setValue] = useState(initialValue);
    const typographicInput = useTypographicInput(value, (nextValue) => {
      setValue(nextValue);
      onValueChange(nextValue);
    });
    return { ...typographicInput, setValue };
  });
  return { ...rendered, onValueChange };
};

describe('useTypographicInput', () => {
  it('passes the raw value on when no rule fires', () => {
    const { result, onValueChange } = renderTypographicInput();

    act(() => {
      result.current.handleChange(typed('a-', 2));
    });

    expect(onValueChange).toHaveBeenCalledWith('a-');
  });

  it('passes the substituted value on when the typed character completes a rule', () => {
    const { result, onValueChange } = renderTypographicInput();
    act(() => {
      result.current.handleChange(typed('a-', 2));
    });

    act(() => {
      result.current.handleChange(typed('a--', 3));
    });

    expect(onValueChange).toHaveBeenLastCalledWith('a—');
  });

  it('judges the next keystroke against the substituted value, not the raw one', () => {
    const { result, onValueChange } = renderTypographicInput();
    act(() => {
      result.current.handleChange(typed('a-', 2));
    });
    act(() => {
      result.current.handleChange(typed('a--', 3));
    });

    act(() => {
      result.current.handleChange(typed('a—>', 3));
    });

    expect(onValueChange).toHaveBeenLastCalledWith('a→');
  });

  it('moves the caret after the substituted glyph on the next render, once', () => {
    const { result, rerender } = renderTypographicInput();
    const input = document.createElement('input');
    const setSelectionRange = vi.spyOn(input, 'setSelectionRange');
    result.current.inputRef.current = input;
    act(() => {
      result.current.handleChange(typed('a-', 2));
    });
    act(() => {
      result.current.handleChange(typed('a--', 3));
    });

    rerender();
    rerender();

    expect(setSelectionRange).toHaveBeenCalledTimes(1);
    expect(setSelectionRange).toHaveBeenCalledWith(2, 2);
  });

  it('leaves the caret alone when no rule fired', () => {
    const { result, rerender } = renderTypographicInput();
    const input = document.createElement('input');
    const setSelectionRange = vi.spyOn(input, 'setSelectionRange');
    result.current.inputRef.current = input;
    act(() => {
      result.current.handleChange(typed('ab', 2));
    });

    rerender();

    expect(setSelectionRange).not.toHaveBeenCalled();
  });

  it('substitutes at the first keystroke into a field that already held text', () => {
    const { result, onValueChange } =
      renderTypographicInput('abcdefghijklmnop-');

    act(() => {
      result.current.handleChange(typed('abcdefghijklmnop->', 18));
    });

    expect(onValueChange).toHaveBeenCalledWith('abcdefghijklmnop→');
  });

  it('substitutes at the first keystroke after the value changed from outside the field', () => {
    const { result, onValueChange } = renderTypographicInput();
    act(() => {
      result.current.setValue('a-');
    });

    act(() => {
      result.current.handleChange(typed('a--', 3));
    });

    expect(onValueChange).toHaveBeenCalledWith('a—');
  });
});
