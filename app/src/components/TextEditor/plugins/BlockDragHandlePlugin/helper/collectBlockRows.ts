import { $getRoot, $isParagraphNode } from 'lexical';
import type { ElementNode, LexicalEditor, NodeKey } from 'lexical';
import { $isListItemNode, $isListNode } from '@lexical/list';
import type { ListNode } from '@lexical/list';
import { $isToggleBodyNode } from '../../../nodes/ToggleBodyNode';
import { $isToggleNode } from '../../../nodes/ToggleNode';
import { subListOf } from './subListOf';
import { wrapperAfter } from './wrapperAfter';

// Where a drop lands relative to the block or list it is placed beside.
export type DropPlacement = 'before' | 'after';

// What a list item's row knows of its list: the item's depth, the width of one level of indentation (the computed padding of the root list), and the root list it belongs to (the list that stands directly in the root or in a toggle body), whose margins open the gaps before and after the whole list.
export type ListRowInfo = {
  depth: number;
  step: number;
  rootKey: NodeKey;
  rootElement: HTMLElement;
  rootMarginTop: number;
  rootMarginBottom: number;
};

// One block the pointer can pick up or drop beside, with the layout the resolvers read: client coordinates of its rectangle and its computed margins. A toggle is one row whose `top` and `bottom` are its header's, and whose key is the toggle's, so the row moves the toggle with its body; a list item is one row whose key is the item's, so the row moves the item with its sub-items. `unitBottom` is the bottom of the whole unit and `endElement` the element that ends it: the toggle, or the nesting wrapper that holds an item's sub-items; the element of every other row.
export type BlockRow = {
  key: NodeKey;
  element: HTMLElement;
  endElement: HTMLElement;
  top: number;
  bottom: number;
  unitBottom: number;
  // The left edge of the row's text, and of its marker column for a list item: `left` less the list's step.
  left: number;
  markerLeft: number;
  marginTop: number;
  marginBottom: number;
  // The keys of the units that enclose the row, outermost first: the toggles whose open bodies enclose it, then, for a list item, its parent items.
  ancestry: readonly NodeKey[];
  // Whether the row may land inside a list: a paragraph or a list item.
  canJoinList: boolean;
  list: ListRowInfo | null;
};

// A margin the stylesheet leaves unset computes to an empty string, which parses to NaN.
const marginInPixels = (value: string): number => Number.parseFloat(value) || 0;

// The root list of a list item: the list that stands directly in the root or in a toggle body, whose element's padding is the width of one level of indentation for every list inside it.
type RootList = {
  key: NodeKey;
  element: HTMLElement;
  step: number;
  marginTop: number;
  marginBottom: number;
};

const listRows = (
  editor: LexicalEditor,
  list: ListNode,
  root: RootList,
  ancestry: readonly NodeKey[],
): BlockRow[] =>
  list.getChildren().flatMap((item) => {
    const orphanSubList = subListOf(item);
    if (orphanSubList !== null) {
      // A wrapper is read with the item before it, whose sub-items its list holds; one with no such item has no parent to read it with.
      const previous = item.getPreviousSibling();
      const hasParentItem =
        $isListItemNode(previous) && subListOf(previous) === null;
      return hasParentItem
        ? []
        : listRows(editor, orphanSubList, root, ancestry);
    }
    if (!$isListItemNode(item)) return [];
    const element = editor.getElementByKey(item.getKey());
    if (element === null) return [];
    const wrapper = wrapperAfter(item);
    const subList = subListOf(wrapper);
    const wrapperElement =
      wrapper === null ? null : editor.getElementByKey(wrapper.getKey());
    const endElement = wrapperElement ?? element;
    const rect = element.getBoundingClientRect();
    const key = item.getKey();
    const row: BlockRow = {
      key,
      element,
      endElement,
      top: rect.top,
      bottom: rect.bottom,
      unitBottom: endElement.getBoundingClientRect().bottom,
      left: rect.left,
      markerLeft: rect.left - root.step,
      marginTop: marginInPixels(getComputedStyle(element).marginTop),
      marginBottom: marginInPixels(getComputedStyle(endElement).marginBottom),
      ancestry,
      canJoinList: true,
      list: {
        depth: item.getIndent(),
        step: root.step,
        rootKey: root.key,
        rootElement: root.element,
        rootMarginTop: root.marginTop,
        rootMarginBottom: root.marginBottom,
      },
    };
    return subList === null
      ? [row]
      : [row, ...listRows(editor, subList, root, [...ancestry, key])];
  });

// The rows of a list standing in the root or in a toggle body; none when it is not rendered.
const rootListRows = (
  editor: LexicalEditor,
  list: ListNode,
  ancestry: readonly NodeKey[],
): BlockRow[] => {
  const element = editor.getElementByKey(list.getKey());
  if (element === null) return [];
  const style = getComputedStyle(element);
  const root: RootList = {
    key: list.getKey(),
    element,
    step: marginInPixels(style.paddingLeft),
    marginTop: marginInPixels(style.marginTop),
    marginBottom: marginInPixels(style.marginBottom),
  };
  return listRows(editor, list, root, ancestry);
};

const rowsOf = (
  editor: LexicalEditor,
  container: ElementNode,
  ancestry: readonly NodeKey[],
): BlockRow[] =>
  container.getChildren().flatMap((child) => {
    if ($isListNode(child)) return rootListRows(editor, child, ancestry);
    const key = child.getKey();
    const element = editor.getElementByKey(key);
    if (element === null) return [];
    const isToggle = $isToggleNode(child);
    const header = isToggle ? child.getFirstChild() : null;
    const headerElement =
      header === null ? null : editor.getElementByKey(header.getKey());
    const bandRect = (headerElement ?? element).getBoundingClientRect();
    const unitRect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const row: BlockRow = {
      key,
      element,
      endElement: element,
      top: bandRect.top,
      bottom: bandRect.bottom,
      unitBottom: unitRect.bottom,
      left: unitRect.left,
      markerLeft: unitRect.left,
      marginTop: marginInPixels(style.marginTop),
      marginBottom: marginInPixels(style.marginBottom),
      ancestry,
      canJoinList: $isParagraphNode(child),
      list: null,
    };
    const body = isToggle && !child.isCollapsed() ? child.getLastChild() : null;
    return $isToggleBodyNode(body)
      ? [row, ...rowsOf(editor, body, [...ancestry, key])]
      : [row];
  });

// The one place that reads layout: every resolver downstream is pure over the rows this returns. The rows run in document order, which is the order down the page: a toggle's or a list item's row comes first and the rows inside it follow. A collapsed toggle body's blocks are hidden, a table is one row whose cells are never entered, and a list is its items.
export const collectBlockRows = (editor: LexicalEditor): BlockRow[] =>
  editor.read('latest', () => rowsOf(editor, $getRoot(), []));
