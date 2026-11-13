import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $isTextNode,
  createEditor,
  type LexicalEditor,
  type LexicalNode,
  type RangeSelection,
} from 'lexical';
import { HeadingNode } from '@lexical/rich-text';
import { LinkNode } from '@lexical/link';
import { ListItemNode, ListNode } from '@lexical/list';
import { $isToggleNode, ToggleNode } from '../../../nodes/ToggleNode';
import {
  $createToggleBodyNode,
  $isToggleBodyNode,
  ToggleBodyNode,
} from '../../../nodes/ToggleBodyNode';

// Fixtures for the tests of the toggle plugins: the nodes the text editor registers for blocks, builders for a paragraph and a toggle body, and a text outline of the document to assert on.

export const TOGGLE_TEST_NODES = [
  HeadingNode,
  ListNode,
  ListItemNode,
  LinkNode,
  ToggleNode,
  ToggleBodyNode,
];

// Lexical hands an error thrown inside an update to onError, which by default only logs it, so the editors of these tests rethrow it for a test to see.
export const throwOnError = (error: Error) => {
  throw error;
};

export const makeEditor = () =>
  createEditor({ nodes: TOGGLE_TEST_NODES, onError: throwOnError });

export const paragraph = (text: string) =>
  $createParagraphNode().append($createTextNode(text));

export const body = (...texts: string[]) =>
  $createToggleBodyNode().append(...texts.map(paragraph));

// The children come from a callback because a node is created inside an update.
export const setRootChildren = (
  editor: LexicalEditor,
  children: () => LexicalNode[],
) => {
  editor.update(
    () => {
      $getRoot()
        .clear()
        .append(...children());
    },
    { discrete: true },
  );
};

// A text node is its text, a body or a toggle its children in brackets, any other block its text.
export const outline = (node: LexicalNode): string => {
  if (!$isElementNode(node)) return node.getTextContent();
  const inner = node.getChildren().map(outline).join(', ');
  if ($isToggleBodyNode(node)) return `body[${inner}]`;
  return node instanceof ToggleNode
    ? `toggle[${inner}]`
    : node.getTextContent();
};

export const outlineOfRoot = (editor: LexicalEditor): string[] =>
  editor.read(() => $getRoot().getChildren().map(outline));

export const rootBlockTypes = (editor: LexicalEditor): string[] =>
  editor.read(() =>
    $getRoot()
      .getChildren()
      .map((block) => block.getType()),
  );

export const $firstToggle = (): ToggleNode => {
  const toggle = $getRoot().getFirstChild();
  if (!$isToggleNode(toggle)) {
    throw new Error('The first root block is not a toggle');
  }
  return toggle;
};

export const $bodyOf = (toggle: ToggleNode): ToggleBodyNode => {
  const bodyNode = toggle.getLastChild();
  if (!$isToggleBodyNode(bodyNode)) {
    throw new Error('The last child of the toggle is not a body');
  }
  return bodyNode;
};

// A collapsed caret at `offset` of `node`, as a text point on a text node and an element point on any other node. The selection is not set on the editor.
export const $caretAt = (node: LexicalNode, offset: number): RangeSelection => {
  const selection = $createRangeSelection();
  const type = $isTextNode(node) ? 'text' : 'element';
  selection.anchor.set(node.getKey(), offset, type);
  selection.focus.set(node.getKey(), offset, type);
  return selection;
};

// Runs `read` inside an update, as the helpers under test need an active editor, and returns what it returns.
export const inEditor = <T>(editor: LexicalEditor, read: () => T): T => {
  let result: T | null = null;
  editor.update(
    () => {
      result = read();
    },
    { discrete: true },
  );
  return result as T;
};
