import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useActionAmounts } from '../useActionAmounts';

const renderAmounts = (selectedIds: string[]) =>
  renderHook(
    (props: { selectedIds: string[] }) => useActionAmounts(props.selectedIds),
    {
      initialProps: { selectedIds },
    },
  );

describe('useActionAmounts', () => {
  it('starts every row with an empty amount', () => {
    const { result } = renderAmounts(['a', 'b']);

    expect(result.current.sharedText).toBe('');
    expect(result.current.amountTextOf('a')).toBe('');
  });

  it('fills every row from the shared text and clears the row overrides when it is set', () => {
    const { result } = renderAmounts(['a', 'b']);
    act(() => {
      result.current.setRowText('a', '9');
    });

    act(() => {
      result.current.setSharedText('4');
    });

    expect(result.current.sharedText).toBe('4');
    expect(result.current.amountTextOf('a')).toBe('4');
    expect(result.current.amountTextOf('b')).toBe('4');
  });

  it('changes one row only when a row text is set', () => {
    const { result } = renderAmounts(['a', 'b']);
    act(() => {
      result.current.setSharedText('4');
    });

    act(() => {
      result.current.setRowText('a', '9');
    });

    expect(result.current.amountTextOf('a')).toBe('9');
    expect(result.current.amountTextOf('b')).toBe('4');
    expect(result.current.sharedText).toBe('4');
  });

  it('shows the amount of the remaining row after a rerender from two selected to one, and to the next single selection', () => {
    const { result, rerender } = renderAmounts(['a', 'b']);
    act(() => {
      result.current.setRowText('a', '9');
    });

    rerender({ selectedIds: ['a'] });
    expect(result.current.amountTextOf('a')).toBe('9');

    rerender({ selectedIds: ['c'] });
    expect(result.current.amountTextOf('c')).toBe('9');
  });

  it('gives a row that joins the selection the shared text', () => {
    const { result, rerender } = renderAmounts(['a', 'b']);
    act(() => {
      result.current.setSharedText('4');
    });
    act(() => {
      result.current.setRowText('a', '9');
    });

    rerender({ selectedIds: ['a', 'b', 'c'] });

    expect(result.current.amountTextOf('a')).toBe('9');
    expect(result.current.amountTextOf('c')).toBe('4');
  });
});
