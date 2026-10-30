import { act, fireEvent, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useEncounterSelection } from '../useEncounterSelection';

const PLAIN = { shift: false, toggle: false };
const SHIFT = { shift: true, toggle: false };
const TOGGLE = { shift: false, toggle: true };

const renderSelection = (
  encounterId = 'encounter-1',
  shownIds = ['a', 'b', 'c'],
  middleColumnRef: { current: HTMLElement | null } = { current: null },
) =>
  renderHook(
    (props: { encounterId: string; shownIds: string[] }) =>
      useEncounterSelection(props.encounterId, props.shownIds, middleColumnRef),
    { initialProps: { encounterId, shownIds } },
  );

const mountMiddleColumn = (innerHtml: string) => {
  const column = document.createElement('div');
  column.innerHTML = innerHtml;
  const outside = document.createElement('input');
  document.body.append(column, outside);
  return { column, outside };
};

describe('useEncounterSelection', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('starts with nothing selected on the Add tab', () => {
    const { result } = renderSelection();

    expect(result.current).toMatchObject({
      selectedIds: [],
      activeTab: 'add',
    });
  });

  it('selects the id and switches to the Actions tab', () => {
    const { result } = renderSelection();

    act(() => {
      result.current.select('a', PLAIN);
    });

    expect(result.current).toMatchObject({
      selectedIds: ['a'],
      activeTab: 'actions',
    });
  });

  it.each(['actions', 'log'] as const)(
    'selects the id and leaves the %s tab open',
    (tab) => {
      const { result } = renderSelection();
      act(() => {
        result.current.setActiveTab(tab);
      });

      act(() => {
        result.current.select('a', PLAIN);
      });

      expect(result.current).toMatchObject({
        selectedIds: ['a'],
        activeTab: tab,
      });
    },
  );

  it('moves the Add tab to Actions on a toggle click that leaves nothing selected', () => {
    const { result } = renderSelection();
    act(() => {
      result.current.select('a', TOGGLE);
    });
    act(() => {
      result.current.setActiveTab('add');
    });

    act(() => {
      result.current.select('a', TOGGLE);
    });

    expect(result.current).toMatchObject({
      selectedIds: [],
      activeTab: 'actions',
    });
  });

  it('lists the selected ids in the order of the shown ids whatever order the clicks came in', () => {
    const { result } = renderSelection();

    act(() => {
      result.current.select('c', PLAIN);
    });
    act(() => {
      result.current.select('a', TOGGLE);
    });

    expect(result.current.selectedIds).toEqual(['a', 'c']);
  });

  it('keeps the selection when the tab is switched back to Add', () => {
    const { result } = renderSelection();
    act(() => {
      result.current.select('a', PLAIN);
    });

    act(() => {
      result.current.setActiveTab('add');
    });

    expect(result.current).toMatchObject({
      selectedIds: ['a'],
      activeTab: 'add',
    });
  });

  it('clears the selection on Escape and keeps the tab, and ignores another key', () => {
    const { result } = renderSelection();
    act(() => {
      result.current.select('a', PLAIN);
    });

    fireEvent.keyDown(document, { key: 'Enter' });
    expect(result.current.selectedIds).toEqual(['a']);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(result.current).toMatchObject({
      selectedIds: [],
      activeTab: 'actions',
    });
  });

  it('clears the anchor with the selection on Escape, so a later Shift-click selects only the clicked id', () => {
    const { result } = renderSelection();
    act(() => {
      result.current.select('a', PLAIN);
    });
    fireEvent.keyDown(document, { key: 'Escape' });

    act(() => {
      result.current.select('c', SHIFT);
    });

    expect(result.current.selectedIds).toEqual(['c']);
  });

  it('ranges a Shift-click from the anchor of the last click without Shift', () => {
    const { result } = renderSelection();
    act(() => {
      result.current.select('a', PLAIN);
    });

    act(() => {
      result.current.select('c', SHIFT);
    });

    expect(result.current.selectedIds).toEqual(['a', 'b', 'c']);
  });

  it('drops a selected id that leaves the shown ids, keeps the others and keeps it dropped when the id returns', () => {
    const { result, rerender } = renderSelection();
    act(() => {
      result.current.select('a', PLAIN);
    });
    act(() => {
      result.current.select('b', TOGGLE);
    });

    rerender({ encounterId: 'encounter-1', shownIds: ['b', 'c'] });
    expect(result.current.selectedIds).toEqual(['b']);

    rerender({ encounterId: 'encounter-1', shownIds: ['a', 'b', 'c'] });
    expect(result.current.selectedIds).toEqual(['b']);
  });

  it('resets the selection, the anchor and the tab when the encounter id changes', () => {
    const { result, rerender } = renderSelection();
    act(() => {
      result.current.select('a', PLAIN);
    });

    rerender({ encounterId: 'encounter-2', shownIds: ['a', 'b', 'c'] });
    expect(result.current).toMatchObject({
      selectedIds: [],
      activeTab: 'add',
    });

    act(() => {
      result.current.select('c', SHIFT);
    });
    expect(result.current.selectedIds).toEqual(['c']);
  });

  it('removes its Escape listener from the document when it unmounts', () => {
    const removeEventListener = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderSelection();

    unmount();

    expect(removeEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
    );
    removeEventListener.mockRestore();
  });

  it('shows the clicked id', () => {
    const { result } = renderSelection();

    act(() => {
      result.current.select('b', PLAIN);
    });

    expect(result.current.shownItemId).toBe('b');
  });

  it('shows another id after a toggle that adds it and after a Shift-click', () => {
    const { result } = renderSelection();
    act(() => {
      result.current.select('a', PLAIN);
    });

    act(() => {
      result.current.select('b', TOGGLE);
    });
    expect(result.current.shownItemId).toBe('b');

    act(() => {
      result.current.select('c', SHIFT);
    });
    expect(result.current.shownItemId).toBe('c');
  });

  it('shows nothing when a toggle removes the shown id and keeps the shown id when a toggle removes another', () => {
    const { result } = renderSelection();
    act(() => {
      result.current.select('a', PLAIN);
    });
    act(() => {
      result.current.select('b', TOGGLE);
    });

    act(() => {
      result.current.select('a', TOGGLE);
    });
    expect(result.current.shownItemId).toBe('b');

    act(() => {
      result.current.select('b', TOGGLE);
    });
    expect(result.current.shownItemId).toBeNull();
  });

  it('shows nothing after Escape and after the encounter id changes', () => {
    const { result, rerender } = renderSelection();
    act(() => {
      result.current.select('a', PLAIN);
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(result.current.shownItemId).toBeNull();

    act(() => {
      result.current.select('a', PLAIN);
    });
    rerender({ encounterId: 'encounter-2', shownIds: ['a', 'b', 'c'] });
    expect(result.current.shownItemId).toBeNull();
  });

  it('returns no shown id in the render where it leaves the shown ids', () => {
    const { result, rerender } = renderSelection();
    act(() => {
      result.current.select('a', PLAIN);
    });

    rerender({ encounterId: 'encounter-1', shownIds: ['b', 'c'] });

    expect(result.current.shownItemId).toBeNull();
  });

  it('keeps the selection and the shown id on Escape in an input of the middle column', () => {
    const middleColumnRef = { current: null as HTMLElement | null };
    const { column } = mountMiddleColumn('<input aria-label="field" />');
    middleColumnRef.current = column;
    const { result } = renderSelection(undefined, undefined, middleColumnRef);
    act(() => {
      result.current.select('a', PLAIN);
    });

    const input = column.querySelector('input');
    if (!input) throw new Error('No input in the middle column');
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(result.current).toMatchObject({
      selectedIds: ['a'],
      shownItemId: 'a',
    });
  });

  it('clears the selection and the shown id on Escape on a button of the middle column', () => {
    const middleColumnRef = { current: null as HTMLElement | null };
    const { column } = mountMiddleColumn('<button>button</button>');
    middleColumnRef.current = column;
    const { result } = renderSelection(undefined, undefined, middleColumnRef);
    act(() => {
      result.current.select('a', PLAIN);
    });

    const button = column.querySelector('button');
    if (!button) throw new Error('No button in the middle column');
    fireEvent.keyDown(button, { key: 'Escape' });

    expect(result.current).toMatchObject({
      selectedIds: [],
      shownItemId: null,
    });
  });

  it('clears the selection and the shown id on Escape in an input outside the middle column', () => {
    const middleColumnRef = { current: null as HTMLElement | null };
    const { column, outside } = mountMiddleColumn('<input />');
    middleColumnRef.current = column;
    const { result } = renderSelection(undefined, undefined, middleColumnRef);
    act(() => {
      result.current.select('a', PLAIN);
    });

    fireEvent.keyDown(outside, { key: 'Escape' });

    expect(result.current).toMatchObject({
      selectedIds: [],
      shownItemId: null,
    });
  });
});
