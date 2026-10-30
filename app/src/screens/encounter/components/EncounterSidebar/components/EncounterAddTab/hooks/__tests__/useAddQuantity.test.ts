import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAddQuantity } from '../useAddQuantity';

describe('useAddQuantity', () => {
  it('starts at the text 1 with quantity 1', () => {
    const { result } = renderHook(() => useAddQuantity());

    expect(result.current.quantityText).toBe('1');
    expect(result.current.quantity).toBe(1);
  });

  it('reads a valid text as the quantity and an invalid one as null', () => {
    const { result } = renderHook(() => useAddQuantity());

    act(() => {
      result.current.changeQuantityText('5');
    });
    expect(result.current.quantity).toBe(5);

    act(() => {
      result.current.changeQuantityText('0');
    });
    expect(result.current.quantityText).toBe('0');
    expect(result.current.quantity).toBeNull();
  });

  it('puts the last valid quantity back on revert, not the initial 1', () => {
    const { result } = renderHook(() => useAddQuantity());
    act(() => {
      result.current.changeQuantityText('5');
    });
    act(() => {
      result.current.changeQuantityText('');
    });

    act(() => {
      result.current.revertQuantityText();
    });

    expect(result.current.quantityText).toBe('5');
  });

  it('returns to the text 1 on reset and reverts to 1 afterwards', () => {
    const { result } = renderHook(() => useAddQuantity());
    act(() => {
      result.current.changeQuantityText('7');
    });

    act(() => {
      result.current.reset();
    });
    expect(result.current.quantityText).toBe('1');

    act(() => {
      result.current.changeQuantityText('');
    });
    act(() => {
      result.current.revertQuantityText();
    });
    expect(result.current.quantityText).toBe('1');
  });
});
