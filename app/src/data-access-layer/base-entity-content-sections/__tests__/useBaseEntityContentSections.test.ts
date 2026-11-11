import { act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BaseEntityContentSection } from '@db/base-entity-content-section';
import type * as service from '@services/baseEntityContentSectionService';
import { AUTOSAVE_DELAY_MS } from '../../createAutosaveQueue';
import {
  renderHookWithQueryClient,
  settle,
} from '../../__tests__/support/renderHookWithQueryClient';
import { baseEntityContentSectionKeys } from '../baseEntityContentSectionKeys';
import { useBaseEntityContentSections } from '../useBaseEntityContentSections';

const getSectionsByBaseEntityId = vi.hoisted(() =>
  vi.fn<typeof service.getSectionsByBaseEntityId>(),
);
const updateSection = vi.hoisted(() => vi.fn<typeof service.updateSection>());
const createSection = vi.hoisted(() => vi.fn<typeof service.createSection>());
const deleteSection = vi.hoisted(() => vi.fn<typeof service.deleteSection>());
const bulkReorderSections = vi.hoisted(() =>
  vi.fn<typeof service.bulkReorderSections>(),
);

vi.mock('@services/baseEntityContentSectionService', () => ({
  getSectionsByBaseEntityId,
  updateSection,
  createSection,
  deleteSection,
  bulkReorderSections,
}));

const sectionRow = (
  baseEntityId: string,
  overrides: Partial<BaseEntityContentSection> = {},
): BaseEntityContentSection => ({
  id: 'section-1',
  base_entity_id: baseEntityId,
  name: null,
  type: 'text',
  content: null,
  checked: 0,
  sort_order: 0,
  created_at: '2026-01-10T09:00:00.000Z',
  updated_at: '2026-01-10T09:00:00.000Z',
  ...overrides,
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

  it("builds a second content write on the first one's result instead of the rendered content", async () => {
    const { result } = await renderSections();

    act(() => {
      result.current.updateSectionContent(
        'section-1',
        (current) => `${current ?? ''}a`,
      );
      result.current.updateSectionContent(
        'section-1',
        (current) => `${current ?? ''}b`,
      );
    });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateSection).toHaveBeenCalledTimes(1);
    expect(updateSection).toHaveBeenCalledWith('section-1', { content: 'ab' });
  });

  it('saves nothing for a section absent from the cached list', async () => {
    const { result } = await renderSections();

    act(() => {
      result.current.updateSectionContent('section-2', () => 'content');
    });
    await settle(AUTOSAVE_DELAY_MS);

    expect(updateSection).not.toHaveBeenCalled();
  });

  it('createSection resolves only after the section list refetch settles', async () => {
    const { result } = await renderSections();
    createSection.mockResolvedValue('section-2');
    let resolveRefetch: (sections: BaseEntityContentSection[]) => void = () => {
      return;
    };
    getSectionsByBaseEntityId.mockImplementationOnce(
      () =>
        new Promise<BaseEntityContentSection[]>((resolve) => {
          resolveRefetch = resolve;
        }),
    );
    let hasResolved = false;

    act(() => {
      void result.current.createSection('text', 'Text').then(() => {
        hasResolved = true;
      });
    });
    await settle(0);

    expect(hasResolved).toBe(false);
    expect(createSection).toHaveBeenCalledWith('entity-1', 'text', 'Text');

    resolveRefetch([
      sectionRow('entity-1'),
      {
        ...sectionRow('entity-1'),
        id: 'section-2',
        name: 'Text',
        sort_order: 1,
      },
    ]);
    await settle(0);

    expect(hasResolved).toBe(true);
    expect(result.current.sections.map((section) => section.id)).toEqual([
      'section-1',
      'section-2',
    ]);
  });
});

const threeSections = (baseEntityId: string): BaseEntityContentSection[] => [
  sectionRow(baseEntityId, { id: 'first', sort_order: 0, name: 'First' }),
  sectionRow(baseEntityId, { id: 'second', sort_order: 1, name: 'Second' }),
  sectionRow(baseEntityId, { id: 'third', sort_order: 2, name: 'Third' }),
];

const renderThreeSections = async () => {
  getSectionsByBaseEntityId.mockImplementation((baseEntityId) =>
    Promise.resolve(threeSections(baseEntityId)),
  );
  return renderSections();
};

describe('useBaseEntityContentSections data', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    createSection.mockReset().mockResolvedValue('created-section');
    deleteSection.mockReset().mockResolvedValue(undefined);
    bulkReorderSections.mockReset().mockResolvedValue(undefined);
    updateSection.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports no sections and loading until the list has loaded, then the loaded sections', async () => {
    getSectionsByBaseEntityId.mockImplementation((baseEntityId) =>
      Promise.resolve(threeSections(baseEntityId)),
    );
    const { result } = renderHookWithQueryClient(
      ({ baseEntityId }: { baseEntityId: string }) =>
        useBaseEntityContentSections(baseEntityId),
      { initialProps: { baseEntityId: 'entity-1' } },
    );

    expect(result.current.sections).toEqual([]);
    expect(result.current.loading).toBe(true);

    await settle(0);

    expect(result.current.sections.map((section) => section.id)).toEqual([
      'first',
      'second',
      'third',
    ]);
    expect(result.current.loading).toBe(false);
  });

  it('shows an edit at once in the cached section and leaves the other sections as they are', async () => {
    const { result } = await renderThreeSections();

    act(() => {
      result.current.updateSection('second', { name: 'Renamed' });
    });
    await settle(0);

    expect(result.current.sections.map((section) => section.name)).toEqual([
      'First',
      'Renamed',
      'Third',
    ]);
  });

  it('creates the section for the base entity with its type and name, and with no name when none is given', async () => {
    const { result } = await renderThreeSections();

    await act(async () => {
      await result.current.createSection('text', 'Notes');
      await result.current.createSection('basic-stat-block');
    });

    expect(createSection.mock.calls).toEqual([
      ['entity-1', 'text', 'Notes'],
      ['entity-1', 'basic-stat-block', undefined],
    ]);
  });

  it('invalidates the list of the base entity when a section is created or deleted', async () => {
    const { result, invalidateQueries } = await renderThreeSections();

    await act(async () => {
      await result.current.createSection('text');
    });
    expect(invalidateQueries).toHaveBeenLastCalledWith({
      queryKey: baseEntityContentSectionKeys.list('entity-1'),
    });
    invalidateQueries.mockClear();

    await act(async () => {
      await result.current.deleteSection('second');
    });

    expect(deleteSection).toHaveBeenCalledWith('second');
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: baseEntityContentSectionKeys.list('entity-1'),
    });
  });

  it('shows the given order with each section numbered by its position, drops ids that are not cached and saves the order', async () => {
    const { result } = await renderThreeSections();

    act(() => {
      result.current.bulkReorder(['third', 'unknown', 'first', 'second']);
    });
    await settle(0);

    expect(
      result.current.sections.map((section) => [
        section.id,
        section.sort_order,
      ]),
    ).toEqual([
      ['third', 0],
      ['first', 2],
      ['second', 3],
    ]);
    expect(bulkReorderSections).toHaveBeenCalledWith([
      'third',
      'unknown',
      'first',
      'second',
    ]);
  });

  it('reloads the list when the bulk reorder fails and does not when it succeeds', async () => {
    const { result, invalidateQueries, queryClient } =
      await renderThreeSections();
    // The app's client throws a failed mutation into the Error Boundary; this test reads what the hook does before that.
    queryClient.setDefaultOptions({ mutations: { throwOnError: false } });

    act(() => {
      result.current.bulkReorder(['second', 'first', 'third']);
    });
    await settle(0);
    expect(invalidateQueries).not.toHaveBeenCalled();

    bulkReorderSections.mockRejectedValue(new Error('disk'));
    act(() => {
      result.current.bulkReorder(['first', 'second', 'third']);
    });
    await settle(0);

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: baseEntityContentSectionKeys.list('entity-1'),
    });
  });

  it('changes nothing in the cache before the list has loaded and composes no content', () => {
    getSectionsByBaseEntityId.mockImplementation(
      () => new Promise<BaseEntityContentSection[]>(() => undefined),
    );
    const { result, queryClient } = renderHookWithQueryClient(
      ({ baseEntityId }: { baseEntityId: string }) =>
        useBaseEntityContentSections(baseEntityId),
      { initialProps: { baseEntityId: 'entity-1' } },
    );

    act(() => {
      result.current.updateSection('first', { name: 'x' });
      result.current.updateSectionContent('first', () => 'content');
      result.current.bulkReorder(['first']);
    });

    expect(
      queryClient.getQueryData(baseEntityContentSectionKeys.list('entity-1')),
    ).toBeUndefined();
  });
});
