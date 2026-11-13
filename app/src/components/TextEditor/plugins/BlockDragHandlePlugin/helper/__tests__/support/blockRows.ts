import type { BlockRow, ListRowInfo } from '../../collectBlockRows';

// A row for a test of the resolvers, which read only the numbers and keys of a row: the geometry the test gives, and for the rest a root paragraph's values.
export const makeRow = (
  key: string,
  geometry: Pick<BlockRow, 'top' | 'bottom'> &
    Partial<
      Pick<
        BlockRow,
        | 'unitBottom'
        | 'left'
        | 'marginTop'
        | 'marginBottom'
        | 'ancestry'
        | 'canJoinList'
      >
    >,
): BlockRow => {
  const element = document.createElement('div');
  return {
    key,
    element,
    endElement: element,
    unitBottom: geometry.bottom,
    left: 16,
    markerLeft: geometry.left ?? 16,
    marginTop: 0,
    marginBottom: 6,
    ancestry: [],
    canJoinList: true,
    list: null,
    ...geometry,
  };
};

// A list item's row: the item's text edge `left`, its depth, and its list's root list `rootKey`, with a step of 24 between the levels. The marker column is one step left of the text.
export const makeItemRow = (
  key: string,
  geometry: Pick<BlockRow, 'top' | 'bottom'> &
    Partial<Pick<BlockRow, 'unitBottom' | 'marginTop' | 'marginBottom'>>,
  item: { depth: number; rootKey: string; parents?: readonly string[] },
  toggles: readonly string[] = [],
): BlockRow => {
  const step = 24;
  const left = 16 + step * (item.depth + 1);
  const rootElement = document.createElement('div');
  const list: ListRowInfo = {
    depth: item.depth,
    step,
    rootKey: item.rootKey,
    rootElement,
    rootMarginTop: 2,
    rootMarginBottom: 10,
  };
  return {
    ...makeRow(key, { ...geometry, left }),
    markerLeft: left - step,
    ancestry: [...toggles, ...(item.parents ?? [])],
    list,
  };
};
