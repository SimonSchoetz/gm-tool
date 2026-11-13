import { describe, expect, it } from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $isElementNode,
  $isTextNode,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import { $createToggleNode } from '../../../../nodes/ToggleNode';
import {
  $bodyOf,
  $firstToggle,
  body,
  makeEditor,
  outline,
  paragraph,
  setRootChildren,
} from '../../../__tests__/support/toggleFixtures';
import { normalizeToggleChildren } from '../normalizeToggleChildren';

const buildToggle = (editor: LexicalEditor, children: () => LexicalNode[]) => {
  setRootChildren(editor, () => [$createToggleNode().append(...children())]);
};

const normalizeFirstToggle = (editor: LexicalEditor) => {
  editor.update(
    () => {
      normalizeToggleChildren($firstToggle());
    },
    { discrete: true },
  );
  return editor
    .getEditorState()
    .read(() => outline($getRoot().getFirstChildOrThrow()));
};

const watchDirtyKeys = (editor: LexicalEditor) => {
  const dirtyKeys: string[] = [];
  editor.registerUpdateListener(({ dirtyElements }) => {
    dirtyKeys.push(...dirtyElements.keys());
  });
  return dirtyKeys;
};

describe('normalizeToggleChildren', () => {
  it('keeps a toggle that is already a header and a body, and writes nothing to it', () => {
    const editor = makeEditor();
    buildToggle(editor, () => [paragraph('Header'), body('One', 'Two')]);
    const dirtyKeys = watchDirtyKeys(editor);

    expect(normalizeFirstToggle(editor)).toBe('toggle[Header, body[One, Two]]');
    expect(dirtyKeys).toEqual([]);
  });

  it('moves a block between header and body to the start of the body, ahead of the body blocks', () => {
    const editor = makeEditor();
    buildToggle(editor, () => [
      paragraph('Header'),
      paragraph('Extra'),
      body('One'),
    ]);

    expect(normalizeFirstToggle(editor)).toBe(
      'toggle[Header, body[Extra, One]]',
    );
  });

  it('keeps the order of several blocks between header and body', () => {
    const editor = makeEditor();
    buildToggle(editor, () => [
      paragraph('Header'),
      paragraph('Extra one'),
      paragraph('Extra two'),
      paragraph('Extra three'),
      body('One'),
    ]);

    expect(normalizeFirstToggle(editor)).toBe(
      'toggle[Header, body[Extra one, Extra two, Extra three, One]]',
    );
  });

  it('moves a block with its text formatting intact instead of rebuilding it', () => {
    const editor = makeEditor();
    buildToggle(editor, () => [
      paragraph('Header'),
      $createParagraphNode().append(
        $createTextNode('plain '),
        $createTextNode('bold').toggleFormat('bold'),
      ),
      body('One'),
    ]);
    normalizeFirstToggle(editor);

    const formats = editor.getEditorState().read(() => {
      const movedBlock = $bodyOf($firstToggle()).getFirstChildOrThrow();
      if (!$isElementNode(movedBlock)) throw new Error('Not a block');
      return movedBlock
        .getChildren()
        .filter($isTextNode)
        .map((child) => `${child.getTextContent()}:${child.getFormat()}`);
    });
    expect(formats).toEqual(['plain :0', 'bold:1']);
  });

  it('moves a block after the body to the end of the body, in order', () => {
    const editor = makeEditor();
    buildToggle(editor, () => [
      paragraph('Header'),
      body('One'),
      paragraph('After one'),
      paragraph('After two'),
    ]);

    expect(normalizeFirstToggle(editor)).toBe(
      'toggle[Header, body[One, After one, After two]]',
    );
  });

  it('gives a toggle without a body one that holds the blocks after its header, in order', () => {
    const editor = makeEditor();
    buildToggle(editor, () => [
      paragraph('Header'),
      paragraph('Extra one'),
      paragraph('Extra two'),
    ]);

    expect(normalizeFirstToggle(editor)).toBe(
      'toggle[Header, body[Extra one, Extra two]]',
    );
  });

  it('gives a toggle that holds one block after its header, and no body, a body holding that block', () => {
    const editor = makeEditor();
    buildToggle(editor, () => [paragraph('Header'), paragraph('Extra')]);

    expect(normalizeFirstToggle(editor)).toBe('toggle[Header, body[Extra]]');
  });

  it('keeps blocks before and after the body in order around the body blocks', () => {
    const editor = makeEditor();
    buildToggle(editor, () => [
      paragraph('Header'),
      paragraph('Before'),
      body('One', 'Two'),
      paragraph('After'),
    ]);

    expect(normalizeFirstToggle(editor)).toBe(
      'toggle[Header, body[Before, One, Two, After]]',
    );
  });

  it('gives a toggle that holds only a header a body with one empty paragraph', () => {
    const editor = makeEditor();
    buildToggle(editor, () => [paragraph('Header')]);

    expect(normalizeFirstToggle(editor)).toBe('toggle[Header, body[]]');
    expect(
      editor
        .getEditorState()
        .read(() => $bodyOf($firstToggle()).getChildrenSize()),
    ).toBe(1);
  });

  it('unwraps a second body into the first and leaves no body inside the body', () => {
    const editor = makeEditor();
    buildToggle(editor, () => [
      paragraph('Header'),
      body('Stray one', 'Stray two'),
      body('One'),
    ]);

    expect(normalizeFirstToggle(editor)).toBe(
      'toggle[Header, body[Stray one, Stray two, One]]',
    );
  });

  it('moves a toggle among the blocks whole, with its own header and body', () => {
    const editor = makeEditor();
    buildToggle(editor, () => [
      paragraph('Header'),
      $createToggleNode().append(paragraph('Inner header'), body('Inner one')),
      body('One'),
    ]);

    expect(normalizeFirstToggle(editor)).toBe(
      'toggle[Header, body[toggle[Inner header, body[Inner one]], One]]',
    );
  });

  it('changes nothing on a second call', () => {
    const editor = makeEditor();
    buildToggle(editor, () => [
      paragraph('Header'),
      paragraph('Extra'),
      body('One'),
    ]);
    normalizeFirstToggle(editor);
    const dirtyKeys = watchDirtyKeys(editor);

    expect(normalizeFirstToggle(editor)).toBe(
      'toggle[Header, body[Extra, One]]',
    );
    expect(dirtyKeys).toEqual([]);
  });
});
