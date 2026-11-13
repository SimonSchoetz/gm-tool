import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { $createListItemNode, $createListNode } from '@lexical/list';
import {
  $createParagraphNode,
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  type RangeSelection,
  $setSelection,
  type LexicalNode,
} from 'lexical';
import { $createToggleNode } from '../../../nodes/ToggleNode';
import { ToggleHeaderGuardPlugin } from '../ToggleHeaderGuardPlugin';
import {
  $bodyOf,
  $firstToggle,
  body,
  makeEditor,
  outlineOfRoot,
  paragraph,
  setRootChildren,
} from '../../__tests__/support/toggleFixtures';
import { mountEditor, updateEditor } from '../../__tests__/support/mountEditor';

// The saved state of an editor that holds the toggle, built in an editor without the guard so the toggle is saved as given.
const savedStateOf = (children: () => LexicalNode[]) => {
  const editor = makeEditor();
  setRootChildren(editor, () => [$createToggleNode().append(...children())]);
  return JSON.stringify(editor.getEditorState().toJSON());
};

// True for a collapsed caret after the last character of the given text, as a text point or as an element point after the text node.
const isCaretAtEndOf = (selection: RangeSelection, text: string) => {
  const { anchor } = selection;
  return (
    selection.isCollapsed() &&
    anchor.getNode().getTextContent() === text &&
    anchor.offset === (anchor.type === 'text' ? text.length : 1)
  );
};

// The transform of a loaded toggle runs in an update the editor schedules after the mount.
const flushTransforms = () => act(() => Promise.resolve());

describe('ToggleHeaderGuardPlugin', () => {
  it('opens a toggle saved with an extra paragraph between header and body as a header and a body, the extra at the start of the body', async () => {
    const editor = mountEditor(
      <ToggleHeaderGuardPlugin />,
      savedStateOf(() => [
        paragraph('Header'),
        paragraph('Extra'),
        body('One'),
      ]),
    );
    await flushTransforms();

    expect(outlineOfRoot(editor)).toEqual(['toggle[Header, body[Extra, One]]']);
  });

  it('moves a paragraph an edit puts next to the header to the start of the body', async () => {
    const editor = mountEditor(
      <ToggleHeaderGuardPlugin />,
      savedStateOf(() => [paragraph('Header'), body('One')]),
    );
    await flushTransforms();

    updateEditor(editor, () => {
      $firstToggle()
        .getFirstChildOrThrow()
        .insertAfter(
          $createParagraphNode().append($createTextNode('Split off')),
        );
    });

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Header, body[Split off, One]]',
    ]);
  });

  it('turns a list in the header place into a paragraph header and also moves the extra block', async () => {
    const editor = mountEditor(
      <ToggleHeaderGuardPlugin />,
      savedStateOf(() => [
        $createListNode('bullet').append(
          $createListItemNode().append($createTextNode('Item')),
        ),
        paragraph('Extra'),
        body('One'),
      ]),
    );
    await flushTransforms();

    expect(outlineOfRoot(editor)).toEqual(['toggle[Item, body[Extra, One]]']);
    expect(
      editor
        .getEditorState()
        .read(() => $firstToggle().getFirstChildOrThrow().getType()),
    ).toBe('paragraph');
  });

  it('puts the caret at the end of the repaired header when it was inside the block that was replaced', async () => {
    const editor = mountEditor(
      <ToggleHeaderGuardPlugin />,
      savedStateOf(() => [paragraph('Header'), body('One')]),
    );
    await flushTransforms();

    updateEditor(editor, () => {
      const item = $createListItemNode().append($createTextNode('Item'));
      $firstToggle()
        .getFirstChildOrThrow()
        .replace($createListNode('bullet').append(item));
      item.select(0, 0);
    });

    expect(
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return null;
        const header = $firstToggle().getFirstChildOrThrow();
        return {
          inHeader: header.isParentOf(selection.anchor.getNode()),
          atEnd: isCaretAtEndOf(selection, 'Item'),
        };
      }),
    ).toEqual({ inHeader: true, atEnd: true });
  });

  it('leaves a caret outside the replaced block where it was', async () => {
    const editor = mountEditor(
      <ToggleHeaderGuardPlugin />,
      savedStateOf(() => [paragraph('Header'), body('One')]),
    );
    await flushTransforms();

    updateEditor(editor, () => {
      const toggle = $firstToggle();
      toggle
        .getFirstChildOrThrow()
        .replace(
          $createListNode('bullet').append(
            $createListItemNode().append($createTextNode('Item')),
          ),
        );
      $bodyOf(toggle).getFirstChildOrThrow().selectEnd();
    });

    expect(
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return null;
        return $bodyOf($firstToggle()).isParentOf(selection.anchor.getNode());
      }),
    ).toBe(true);
  });

  it('repairs a replaced header when the editor has no selection', async () => {
    const editor = mountEditor(
      <ToggleHeaderGuardPlugin />,
      savedStateOf(() => [paragraph('Header'), body('One')]),
    );
    await flushTransforms();

    updateEditor(editor, () => {
      $setSelection(null);
      $firstToggle()
        .getFirstChildOrThrow()
        .replace(
          $createListNode('bullet').append(
            $createListItemNode().append($createTextNode('Item')),
          ),
        );
    });

    expect(outlineOfRoot(editor)).toEqual(['toggle[Item, body[One]]']);
  });
});
