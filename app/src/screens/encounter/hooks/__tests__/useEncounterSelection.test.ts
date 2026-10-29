import { act, fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEncounterSelection } from '../useEncounterSelection';

const renderSelection = (encounterId = 'encounter-1', shownIds = ['a', 'b']) =>
  renderHook(
    (props: { encounterId: string; shownIds: string[] }) =>
      useEncounterSelection(props.encounterId, props.shownIds),
    { initialProps: { encounterId, shownIds } },
  );

describe('useEncounterSelection', () => {
  it('starts with nothing selected on the Add tab', () => {
    const { result } = renderSelection();

    expect(result.current).toMatchObject({
      selectedId: null,
      activeTab: 'add',
    });
  });

  it('selects the id and switches to the Actions tab', () => {
    const { result } = renderSelection();

    act(() => {
      result.current.select('a');
    });

    expect(result.current).toMatchObject({
      selectedId: 'a',
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
        result.current.select('a');
      });

      expect(result.current).toMatchObject({
        selectedId: 'a',
        activeTab: tab,
      });
    },
  );

  it('keeps the selection when the tab is switched back to Add', () => {
    const { result } = renderSelection();
    act(() => {
      result.current.select('a');
    });

    act(() => {
      result.current.setActiveTab('add');
    });

    expect(result.current).toMatchObject({
      selectedId: 'a',
      activeTab: 'add',
    });
  });

  it('clears the selection on Escape and keeps the tab, and ignores another key', () => {
    const { result } = renderSelection();
    act(() => {
      result.current.select('a');
    });

    fireEvent.keyDown(document, { key: 'Enter' });
    expect(result.current.selectedId).toBe('a');

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(result.current).toMatchObject({
      selectedId: null,
      activeTab: 'actions',
    });
  });

  it('clears a selection that leaves the shown ids and keeps it cleared when the id returns', () => {
    const { result, rerender } = renderSelection();
    act(() => {
      result.current.select('a');
    });

    rerender({ encounterId: 'encounter-1', shownIds: ['b'] });
    expect(result.current.selectedId).toBeNull();

    rerender({ encounterId: 'encounter-1', shownIds: ['a', 'b'] });
    expect(result.current.selectedId).toBeNull();
  });

  it('resets the selection and the tab when the encounter id changes', () => {
    const { result, rerender } = renderSelection();
    act(() => {
      result.current.select('a');
    });

    rerender({ encounterId: 'encounter-2', shownIds: ['a', 'b'] });

    expect(result.current).toMatchObject({
      selectedId: null,
      activeTab: 'add',
    });
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
