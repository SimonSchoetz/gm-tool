import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useListNavigation } from '../useListNavigation';

const ONE_ITEM = [{ id: 'a' }];
const TWO_ITEMS = [{ id: 'a' }, { id: 'b' }];
const THREE_ITEMS = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

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

  it('steps to the neighbouring item in list order', () => {
    const { result } = renderNavigation(THREE_ITEMS);

    act(() => {
      result.current.stepNext();
    });
    expect(result.current.selected).toEqual({ id: 'b' });

    act(() => {
      result.current.stepNext();
    });
    expect(result.current.selected).toEqual({ id: 'c' });

    act(() => {
      result.current.stepPrevious();
    });
    expect(result.current.selected).toEqual({ id: 'b' });
  });

  it('reports no previous on the first item and no next on the last, and a step there changes nothing', () => {
    const { result } = renderNavigation(TWO_ITEMS);
    expect(result.current.hasPrevious).toBe(false);
    expect(result.current.hasNext).toBe(true);

    act(() => {
      result.current.stepPrevious();
    });
    expect(result.current.selected).toEqual({ id: 'a' });
    expect(result.current.transition).toBeNull();

    act(() => {
      result.current.stepNext();
    });
    expect(result.current.hasPrevious).toBe(true);
    expect(result.current.hasNext).toBe(false);

    act(() => {
      result.current.stepNext();
    });
    expect(result.current.selected).toEqual({ id: 'b' });
  });

  it('reports neither neighbour for an empty and a single-item list', () => {
    const empty = renderNavigation([]);
    const single = renderNavigation(ONE_ITEM);

    expect(empty.result.current.hasPrevious).toBe(false);
    expect(empty.result.current.hasNext).toBe(false);
    expect(single.result.current.hasPrevious).toBe(false);
    expect(single.result.current.hasNext).toBe(false);
  });

  it('records the direction and the previous item when stepping', () => {
    const { result } = renderNavigation(THREE_ITEMS);

    act(() => {
      result.current.stepNext();
    });
    expect(result.current.transition).toEqual({
      from: { id: 'a' },
      direction: 'forward',
    });

    act(() => {
      result.current.stepPrevious();
    });
    expect(result.current.transition).toEqual({
      from: { id: 'b' },
      direction: 'backward',
    });
  });

  it('records a direction from item order when an item is selected directly', () => {
    const { result } = renderNavigation(THREE_ITEMS);

    act(() => {
      result.current.select('c');
    });
    expect(result.current.transition).toEqual({
      from: { id: 'a' },
      direction: 'forward',
    });

    act(() => {
      result.current.select('a');
    });
    expect(result.current.transition).toEqual({
      from: { id: 'c' },
      direction: 'backward',
    });
  });

  it('records no transition when the selected item is selected again', () => {
    const { result } = renderNavigation(TWO_ITEMS);

    act(() => {
      result.current.select('a');
    });

    expect(result.current.transition).toBeNull();
  });

  it('records no transition when the selection falls back after the selected item leaves the list', () => {
    const { result, rerender } = renderNavigation(TWO_ITEMS);
    act(() => {
      result.current.select('b');
    });
    act(() => {
      result.current.endTransition();
    });

    rerender({ items: ONE_ITEM });

    expect(result.current.selected).toEqual({ id: 'a' });
    expect(result.current.transition).toBeNull();
  });

  it('clears the transition on endTransition', () => {
    const { result } = renderNavigation(TWO_ITEMS);
    act(() => {
      result.current.stepNext();
    });

    act(() => {
      result.current.endTransition();
    });

    expect(result.current.transition).toBeNull();
  });

  it('clears an existing transition when the selected item is selected again', () => {
    const { result } = renderNavigation(TWO_ITEMS);
    act(() => {
      result.current.stepNext();
    });
    expect(result.current.transition).not.toBeNull();

    act(() => {
      result.current.select('b');
    });

    expect(result.current.transition).toBeNull();
  });

  it('records no transition for an id that is not in the list', () => {
    const { result } = renderNavigation(TWO_ITEMS);
    act(() => {
      result.current.stepNext();
    });

    act(() => {
      result.current.select('missing');
    });

    expect(result.current.transition).toBeNull();
  });

  it('records no transition when selecting in an empty list', () => {
    const { result } = renderNavigation([]);

    act(() => {
      result.current.select('a');
    });

    expect(result.current.transition).toBeNull();
    expect(result.current.selected).toBeNull();
  });
});
