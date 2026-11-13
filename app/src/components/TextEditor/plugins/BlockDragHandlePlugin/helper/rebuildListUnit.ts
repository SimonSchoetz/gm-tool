import { $createListItemNode, $isListItemNode } from '@lexical/list';
import type { ListItemNode } from '@lexical/list';
import { subListOf } from './subListOf';
import { wrapperAfter } from './wrapperAfter';

type UnitItem = { item: ListItemNode; relativeDepth: number };

// The unit's real items in document order, each with its depth relative to the unit's own item; a nesting wrapper is read with the item before it.
const unitItems = (item: ListItemNode, relativeDepth: number): UnitItem[] => [
  { item, relativeDepth },
  ...(subListOf(wrapperAfter(item))
    ?.getChildren()
    .flatMap((child) =>
      $isListItemNode(child) && subListOf(child) === null
        ? unitItems(child, relativeDepth + 1)
        : [],
    ) ?? []),
];

// Rebuilds a list item and its sub-items as detached items in document order, the unit's own item first at depth 0, each taking over the children of the original, so the text and inline formatting stay, and its check state. The originals are left childless for the caller to remove.
export const rebuildListUnit = (item: ListItemNode): UnitItem[] =>
  unitItems(item, 0).map(({ item: original, relativeDepth }) => {
    const rebuilt = $createListItemNode(original.getChecked());
    rebuilt.append(...original.getChildren());
    return { item: rebuilt, relativeDepth };
  });
