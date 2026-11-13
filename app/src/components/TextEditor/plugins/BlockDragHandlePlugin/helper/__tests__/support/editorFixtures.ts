import {
  $createParagraphNode,
  $createTextNode,
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  createEditor,
} from 'lexical';
import type { LexicalEditor, LexicalNode } from 'lexical';
import {
  $createListItemNode,
  $createListNode,
  $isListItemNode,
  $isListNode,
  ListItemNode,
  ListNode,
} from '@lexical/list';
import type { ListType } from '@lexical/list';
import { HeadingNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { subListOf } from '../../subListOf';
import {
  $createToggleNode,
  $isToggleNode,
  ToggleNode,
} from '../../../../../nodes/ToggleNode';
import {
  $createToggleBodyNode,
  $isToggleBodyNode,
  ToggleBodyNode,
} from '../../../../../nodes/ToggleBodyNode';

// Fixtures for the tests of the drag handle's helpers: an editor with the nodes the text editor registers for blocks, builders for the blocks, and a text outline of the document to assert on.

// Lexical hands an error thrown inside an update to onError, which by default only logs it, so the editors here rethrow it for a test to see.
const throwOnError = (error: Error) => {
  throw error;
};

export type ItemSpec = {
  text: string;
  checked?: boolean;
  children?: readonly ItemSpec[];
};

export const paragraph = (text: string): LexicalNode =>
  $createParagraphNode().append($createTextNode(text));

export const toggle = (
  header: string,
  body: LexicalNode[],
  collapsed = false,
): LexicalNode =>
  $createToggleNode(collapsed).append(
    paragraph(header),
    $createToggleBodyNode().append(...body),
  );

// A list of the style whose items are built flat and then indented to the depth their spec sits at, as the editor builds a nested list when the user indents.
export const list = (
  style: ListType,
  specs: readonly ItemSpec[],
): LexicalNode => {
  const root = $createListNode(style);
  const flat: { item: ListItemNode; depth: number }[] = [];
  const collect = (level: readonly ItemSpec[], depth: number) => {
    level.forEach((spec) => {
      const item = $createListItemNode(
        style === 'check' ? spec.checked === true : undefined,
      );
      item.append($createTextNode(spec.text));
      flat.push({ item, depth });
      collect(spec.children ?? [], depth + 1);
    });
  };
  collect(specs, 0);
  root.append(...flat.map(({ item }) => item));
  flat.forEach(({ item, depth }) => {
    item.setIndent(depth);
  });
  return root;
};

// An editor holding the blocks `build` makes. With a root element it renders into it, so the blocks have elements; without one it is headless.
export const makeEditor = (
  build: () => LexicalNode[],
  rootElement: HTMLElement | null = null,
): LexicalEditor => {
  const editor = createEditor({
    nodes: [
      ToggleNode,
      ToggleBodyNode,
      ListNode,
      ListItemNode,
      HeadingNode,
      TableNode,
      TableRowNode,
      TableCellNode,
    ],
    onError: throwOnError,
  });
  if (rootElement !== null) editor.setRootElement(rootElement);
  editor.update(
    () => {
      $getRoot().append(...build());
    },
    { discrete: true },
  );
  return editor;
};

const itemsOutline = (listNode: ListNode): string =>
  listNode
    .getChildren()
    .map((item) => {
      if (!$isListItemNode(item)) return '';
      const nested = item.getFirstChild();
      if ($isListNode(nested)) return `[${itemsOutline(nested)}]`;
      const mark =
        item.getChecked() === undefined ? '' : item.getChecked() ? '✓' : '☐';
      return `${mark}${item.getTextContent() || '(empty)'}`;
    })
    .join(',')
    // A nesting wrapper's sub-list is written inside the brackets that follow its parent item.
    .replaceAll(',[', '[');

const blockOutline = (block: LexicalNode): string => {
  if ($isToggleNode(block)) {
    const bodyBlocks = block.getLastChildOrThrow();
    const inner = $isElementNode(bodyBlocks)
      ? bodyBlocks.getChildren().map(blockOutline)
      : [];
    return `${block.getFirstChildOrThrow().getTextContent()}{${inner.join(',')}}`;
  }
  if ($isListNode(block))
    return `${block.getListType()}(${itemsOutline(block)})`;
  return block.getTextContent() || '(empty)';
};

// The document as text: a paragraph by its text, a toggle as `header{body, ...}`, a list as `style(items)` where an item's sub-items follow it in brackets and a check item carries ✓ or ☐.
export const outlineOf = (editor: LexicalEditor): string[] =>
  editor.read('latest', () => $getRoot().getChildren().map(blockOutline));

// The text a block is found by: a toggle by its header's, a list item by its own, nothing for a list, a toggle body or a nesting wrapper.
const ownTextOf = (node: LexicalNode): string | null => {
  if ($isToggleNode(node)) return node.getFirstChildOrThrow().getTextContent();
  if (
    $isListNode(node) ||
    $isToggleBodyNode(node) ||
    subListOf(node) !== null
  ) {
    return null;
  }
  return node.getTextContent();
};

// The key of the block, toggle or list item with the text, found anywhere in the document.
export const keyOf = (editor: LexicalEditor, text: string): string =>
  editor.read('latest', () => {
    const find = (node: LexicalNode): LexicalNode | null => {
      if (ownTextOf(node) === text) return node;
      const inside = $isToggleNode(node)
        ? [node.getLastChildOrThrow()]
        : $isElementNode(node)
          ? node.getChildren()
          : [];
      for (const child of inside) {
        const found = find(child);
        if (found !== null) return found;
      }
      return null;
    };
    const block =
      $getRoot()
        .getChildren()
        .map(find)
        .find((found) => found !== null) ?? null;
    if (block === null) throw new Error(`no block with text ${text}`);
    return block.getKey();
  });

// The key of the outermost list that holds the item with the text, the one that stands in the root or in a toggle's body.
export const rootListKeyOf = (
  editor: LexicalEditor,
  itemText: string,
): string =>
  editor.read('latest', () => {
    let outermost: LexicalNode | null = null;
    for (
      let node = $getNodeByKey(keyOf(editor, itemText));
      node !== null;
      node = node.getParent()
    ) {
      if ($isListNode(node)) outermost = node;
    }
    if (outermost === null) throw new Error(`no list holds ${itemText}`);
    return outermost.getKey();
  });
