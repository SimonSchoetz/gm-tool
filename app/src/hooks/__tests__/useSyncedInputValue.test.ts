import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useSyncedInputValue } from '../useSyncedInputValue';

const renderSynced = (externalValue: string) =>
  renderHook(({ external }) => useSyncedInputValue(external), {
    initialProps: { external: externalValue },
  });

describe('useSyncedInputValue', () => {
  it('starts with the external value', () => {
    const { result } = renderSynced('Goblin');

    expect(result.current.value).toBe('Goblin');
  });

  it('shows typed text immediately without waiting for the external value', () => {
    const { result } = renderSynced('Goblin');

    act(() => {
      result.current.setValue('Goblin King');
    });

    expect(result.current.value).toBe('Goblin King');
  });

  it('adopts a changed external value while the input is not focused', () => {
    const { result, rerender } = renderSynced('Goblin');

    rerender({ external: 'Orc' });

    expect(result.current.value).toBe('Orc');
  });

  it('keeps the typed text when the external value changes during focus', () => {
    const { result, rerender } = renderSynced('Goblin');
    act(() => {
      result.current.focusProps.onFocus();
    });
    act(() => {
      result.current.setValue('Goblin K');
    });

    rerender({ external: 'Orc' });

    expect(result.current.value).toBe('Goblin K');
  });

  it('does not adopt the external value that arrived during focus once the input blurs', () => {
    const { result, rerender } = renderSynced('Goblin');
    act(() => {
      result.current.focusProps.onFocus();
    });
    rerender({ external: 'Orc' });

    act(() => {
      result.current.focusProps.onBlur();
    });

    expect(result.current.value).toBe('Goblin');
  });

  it('adopts the next external change after the input blurs', () => {
    const { result, rerender } = renderSynced('Goblin');
    act(() => {
      result.current.focusProps.onFocus();
    });
    rerender({ external: 'Orc' });
    act(() => {
      result.current.focusProps.onBlur();
    });

    rerender({ external: 'Troll' });

    expect(result.current.value).toBe('Troll');
  });
});
