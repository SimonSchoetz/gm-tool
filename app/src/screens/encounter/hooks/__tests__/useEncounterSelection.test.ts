import { act, fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEncounterSelection } from '../useEncounterSelection';

const PLAIN = { shift: false, toggle: false };
const SHIFT = { shift: true, toggle: false };
const TOGGLE = { shift: false, toggle: true };

const renderSelection = (
  encounterId = 'encounter-1',
  shownIds = ['a', 'b', 'c'],
) =>
  renderHook(
    (props: { encounterId: string; shownIds: string[] }) =>
      useEncounterSelection(props.encounterId, props.shownIds),
    { initialProps: { encounterId, shownIds } },
  );

describe('useEncounterSelection', () => {
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
});
