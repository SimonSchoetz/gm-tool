import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useListNavigation } from '../useListNavigation';

const ONE_ITEM = [{ id: 'a' }];
const TWO_ITEMS = [{ id: 'a' }, { id: 'b' }];

const renderNavigation = (items: { id: string }[]) =>
  renderHook(({ items: current }) => useListNavigation(current), {
    initialProps: { items },
  });

describe('useListNavigation', () => {
  it('shows the first item when nothing is selected', () => {
    const { result } = renderNavigation(TWO_ITEMS);

    expect(result.current.selected).toEqual({ id: 'a' });
  });

  it('shows the selected item', () => {
    const { result } = renderNavigation(TWO_ITEMS);

    act(() => {
      result.current.select('b');
    });

    expect(result.current.selected).toEqual({ id: 'b' });
  });

  it('falls back to the first item when the selected item leaves the list', () => {
    const { result, rerender } = renderNavigation(TWO_ITEMS);
    act(() => {
      result.current.select('b');
    });

    rerender({ items: ONE_ITEM });

    expect(result.current.selected).toEqual({ id: 'a' });
  });

  it("shows a selected item once a later render's list contains it", () => {
    const { result, rerender } = renderNavigation(ONE_ITEM);
    act(() => {
      result.current.select('b');
    });
    expect(result.current.selected).toEqual({ id: 'a' });

    rerender({ items: TWO_ITEMS });

    expect(result.current.selected).toEqual({ id: 'b' });
  });

  it('returns null for an empty list', () => {
    const { result } = renderNavigation([]);

    expect(result.current.selected).toBeNull();
  });

  it('offers navigation only with more than one item', () => {
    const single = renderNavigation(ONE_ITEM);
    const pair = renderNavigation(TWO_ITEMS);

    expect(single.result.current.isNavAvailable).toBe(false);
    expect(pair.result.current.isNavAvailable).toBe(true);
  });

  it('shows the nav only while it is open and available', () => {
    const { result, rerender } = renderNavigation(TWO_ITEMS);

    act(() => {
      result.current.toggleNav();
    });
    expect(result.current.isNavVisible).toBe(true);

    rerender({ items: ONE_ITEM });

    expect(result.current.isNavVisible).toBe(false);
  });

  it('closes the nav on a second toggle', () => {
    const { result } = renderNavigation(TWO_ITEMS);

    act(() => {
      result.current.toggleNav();
    });
    act(() => {
      result.current.toggleNav();
    });

    expect(result.current.isNavVisible).toBe(false);
  });

  it('closes the nav on closeNav and leaves it closed when called again', () => {
    const { result } = renderNavigation(TWO_ITEMS);
    act(() => {
      result.current.toggleNav();
    });

    act(() => {
      result.current.closeNav();
    });
    expect(result.current.isNavVisible).toBe(false);

    act(() => {
      result.current.closeNav();
    });
    expect(result.current.isNavVisible).toBe(false);
  });

  it('closes the nav when an item is selected', () => {
    const { result } = renderNavigation(TWO_ITEMS);
    act(() => {
      result.current.toggleNav();
    });

    act(() => {
      result.current.select('b');
    });

    expect(result.current.isNavVisible).toBe(false);
  });
});
