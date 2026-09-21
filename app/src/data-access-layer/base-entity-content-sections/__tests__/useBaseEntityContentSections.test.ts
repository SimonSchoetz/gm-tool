import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BaseEntityContentSection } from '@db/base-entity-content-section';
import type * as service from '@services/baseEntityContentSectionService';
import { AUTOSAVE_DELAY_MS } from '../../createAutosaveQueue';
import {
  renderHookWithQueryClient,
  settle,
} from '../../__tests__/support/renderHookWithQueryClient';
import { useBaseEntityContentSections } from '../useBaseEntityContentSections';

const getSectionsByBaseEntityId = vi.hoisted(() =>
  vi.fn<typeof service.getSectionsByBaseEntityId>(),
);
const updateSection = vi.hoisted(() => vi.fn<typeof service.updateSection>());

vi.mock('@services/baseEntityContentSectionService', () => ({
  getSectionsByBaseEntityId,
  updateSection,
}));

const sectionRow = (baseEntityId: string): BaseEntityContentSection => ({
  id: 'section-1',
  base_entity_id: baseEntityId,
  name: null,
  type: 'text',
  content: null,
  checked: 0,
  sort_order: 0,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
});

const renderSections = async () => {
  const rendered = renderHookWithQueryClient(
    ({ baseEntityId }: { baseEntityId: string }) =>
      useBaseEntityContentSections(baseEntityId),
    { initialProps: { baseEntityId: 'entity-1' } },
  );
  await settle(0);
  return rendered;
};

describe('useBaseEntityContentSections', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getSectionsByBaseEntityId.mockImplementation((baseEntityId) =>
      Promise.resolve([sectionRow(baseEntityId)]),
    );
    updateSection.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('writes the scheduled section and its data after a re-render for another base entity', async () => {
    const { result, rerender } = await renderSections();

    act(() => {
      result.current.updateSection('section-1', { name: 'n' });
    });
    rerender({ baseEntityId: 'entity-2' });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateSection).toHaveBeenCalledTimes(1);
    expect(updateSection).toHaveBeenCalledWith('section-1', { name: 'n' });
  });

  it('invalidates nothing when a section save completes', async () => {
    const { result, rerender, invalidateQueries } = await renderSections();

    act(() => {
      result.current.updateSection('section-1', { name: 'n' });
    });
    rerender({ baseEntityId: 'entity-2' });
    await settle(AUTOSAVE_DELAY_MS);

    expect(invalidateQueries).not.toHaveBeenCalled();
  });

  it("keeps an earlier edit's value when a later edit to the same section leaves it undefined", async () => {
    const { result } = await renderSections();

    act(() => {
      result.current.updateSection('section-1', { content: 'kept' });
    });
    act(() => {
      result.current.updateSection('section-1', {
        name: 'n',
        content: undefined,
      });
    });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateSection).toHaveBeenCalledTimes(1);
    expect(updateSection).toHaveBeenCalledWith('section-1', {
      content: 'kept',
      name: 'n',
    });
  });
});
