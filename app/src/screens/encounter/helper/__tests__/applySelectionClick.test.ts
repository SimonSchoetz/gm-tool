import { describe, expect, it } from 'vitest';
import { applySelectionClick } from '../applySelectionClick';

const SHOWN = ['a', 'b', 'c', 'd', 'e'];
const PLAIN = { shift: false, toggle: false };
const SHIFT = { shift: true, toggle: false };
const TOGGLE = { shift: false, toggle: true };

describe('applySelectionClick', () => {
  it('selects only the clicked id, anchors it and shows it on a plain click', () => {
    const result = applySelectionClick(
      { ids: ['a', 'b'], anchorId: 'a', shownItemId: 'a' },
      SHOWN,
      'd',
      PLAIN,
    );

    expect(result).toEqual({ ids: ['d'], anchorId: 'd', shownItemId: 'd' });
  });

  it('adds an unselected id on a toggle, anchors it and shows it', () => {
    const result = applySelectionClick(
      { ids: ['a'], anchorId: 'a', shownItemId: 'a' },
      SHOWN,
      'c',
      TOGGLE,
    );

    expect(result).toEqual({
      ids: ['a', 'c'],
      anchorId: 'c',
      shownItemId: 'c',
    });
  });

  it('removes a selected id on a toggle, still anchors it and keeps the shown id', () => {
    const result = applySelectionClick(
      { ids: ['a', 'c'], anchorId: 'a', shownItemId: 'a' },
      SHOWN,
      'c',
      TOGGLE,
    );

    expect(result).toEqual({ ids: ['a'], anchorId: 'c', shownItemId: 'a' });
  });

  it('shows nothing when a toggle removes the shown id', () => {
    const result = applySelectionClick(
      { ids: ['a', 'c'], anchorId: 'c', shownItemId: 'c' },
      SHOWN,
      'c',
      TOGGLE,
    );

    expect(result).toEqual({ ids: ['a'], anchorId: 'c', shownItemId: null });
  });

  it('selects the shown range with both ends from an anchor before the clicked id and shows the clicked id', () => {
    const result = applySelectionClick(
      { ids: ['b'], anchorId: 'b', shownItemId: 'b' },
      SHOWN,
      'd',
      SHIFT,
    );

    expect(result).toEqual({
      ids: ['b', 'c', 'd'],
      anchorId: 'b',
      shownItemId: 'd',
    });
  });

  it('selects the shown range in list order from an anchor after the clicked id', () => {
    const result = applySelectionClick(
      { ids: ['d'], anchorId: 'd', shownItemId: 'd' },
      SHOWN,
      'b',
      SHIFT,
    );

    expect(result).toEqual({
      ids: ['b', 'c', 'd'],
      anchorId: 'd',
      shownItemId: 'b',
    });
  });

  it('ranges a second Shift-click from the same anchor and replaces the first range', () => {
    const first = applySelectionClick(
      { ids: ['b'], anchorId: 'b', shownItemId: 'b' },
      SHOWN,
      'e',
      SHIFT,
    );

    const second = applySelectionClick(first, SHOWN, 'c', SHIFT);

    expect(second).toEqual({
      ids: ['b', 'c'],
      anchorId: 'b',
      shownItemId: 'c',
    });
  });

  it('selects only the clicked id, anchors and shows it on a Shift-click with no anchor', () => {
    const result = applySelectionClick(
      { ids: [], anchorId: null, shownItemId: null },
      SHOWN,
      'c',
      SHIFT,
    );

    expect(result).toEqual({ ids: ['c'], anchorId: 'c', shownItemId: 'c' });
  });

  it('selects only the clicked id, anchors and shows it on a Shift-click whose anchor is not shown', () => {
    const result = applySelectionClick(
      { ids: ['x'], anchorId: 'x', shownItemId: 'x' },
      SHOWN,
      'c',
      SHIFT,
    );

    expect(result).toEqual({ ids: ['c'], anchorId: 'c', shownItemId: 'c' });
  });

  it('lets Shift win when the toggle is also held, for the shown id too', () => {
    const result = applySelectionClick(
      { ids: ['a'], anchorId: 'a', shownItemId: 'a' },
      SHOWN,
      'c',
      { shift: true, toggle: true },
    );

    expect(result).toEqual({
      ids: ['a', 'b', 'c'],
      anchorId: 'a',
      shownItemId: 'c',
    });
  });

  it('lets Shift win over a toggle when there is no anchor', () => {
    const result = applySelectionClick(
      { ids: ['c'], anchorId: null, shownItemId: 'c' },
      SHOWN,
      'c',
      { shift: true, toggle: true },
    );

    expect(result).toEqual({ ids: ['c'], anchorId: 'c', shownItemId: 'c' });
  });
});
