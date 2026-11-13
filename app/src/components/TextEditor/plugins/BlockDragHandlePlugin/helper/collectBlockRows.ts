import { $getRoot } from 'lexical';
import type { ElementNode, LexicalEditor, NodeKey } from 'lexical';
import { $isListNode } from '@lexical/list';
import { $isToggleBodyNode } from '../../../nodes/ToggleBodyNode';
import { $isToggleNode } from '../../../nodes/ToggleNode';

// One block the pointer can pick up or drop beside, with the layout the resolvers read: client coordinates of its rectangle and its computed margins. A toggle is one row whose `top` and `bottom` are its header's, and whose key is the toggle's, so the row moves the toggle with its body; its `unitBottom` is the bottom of the whole toggle.
export type BlockRow = {
  key: NodeKey;
  element: HTMLElement;
  top: number;
  bottom: number;
  unitBottom: number;
  left: number;
  marginTop: number;
  marginBottom: number;
  // The keys of the toggles whose open bodies enclose the row, outermost first.
  ancestry: readonly NodeKey[];
  hasHandle: boolean;
};

// A margin the stylesheet leaves unset computes to an empty string, which parses to NaN.
const marginInPixels = (value: string): number => Number.parseFloat(value) || 0;

const rowsOf = (
  editor: LexicalEditor,
  container: ElementNode,
  ancestry: readonly NodeKey[],
): BlockRow[] =>
  container.getChildren().flatMap((child) => {
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
      top: bandRect.top,
      bottom: bandRect.bottom,
      unitBottom: unitRect.bottom,
      left: unitRect.left,
      marginTop: marginInPixels(style.marginTop),
      marginBottom: marginInPixels(style.marginBottom),
      ancestry,
      hasHandle: !$isListNode(child),
    };
    const body = isToggle && !child.isCollapsed() ? child.getLastChild() : null;
    return $isToggleBodyNode(body)
      ? [row, ...rowsOf(editor, body, [...ancestry, key])]
      : [row];
  });

// The one place that reads layout: every resolver downstream is pure over the rows this returns. The rows run in document order, which is the order down the page: a toggle's row comes first and its open body's rows follow it. A collapsed body's blocks are hidden, and a table is one row whose cells are never entered.
export const collectBlockRows = (editor: LexicalEditor): BlockRow[] =>
  editor.read('latest', () => rowsOf(editor, $getRoot(), []));
