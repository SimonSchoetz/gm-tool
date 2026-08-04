import { describe, it, expect } from 'vitest';
import {
  createEditor,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  LexicalEditor,
} from 'lexical';
import { registerMarkdownShortcuts } from '@lexical/markdown';
import { TYPOGRAPHIC_TRANSFORMERS } from '../typographicTransformers';

const createProbeEditor = (): LexicalEditor => {
  const element = document.createElement('div');
  element.contentEditable = 'true';
  document.body.appendChild(element);

  const editor = createEditor({
    namespace: 'typographic-transformers-test',
    onError: (error: Error) => {
      throw error;
    },
  });
  editor.setRootElement(element);
  registerMarkdownShortcuts(editor, TYPOGRAPHIC_TRANSFORMERS);

  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      $getRoot().clear().append(paragraph);
      paragraph.selectEnd();
    },
    { discrete: true },
  );

  return editor;
};

// The shortcut runner reacts to a keystroke by scheduling its own editor.update from an update listener. A real browser flushes that before the next keystroke arrives because each keypress is a separate task; a synthetic loop does not, so each character is followed by an empty discrete update to force the same flush. Without it a substitution lands one character late and the assertions read a stale value.
const typeInto = (editor: LexicalEditor, characters: string) => {
  for (const character of characters) {
    editor.update(
      () => {
        $getSelection()?.insertText(character);
      },
      { discrete: true },
    );
    editor.update(() => undefined, { discrete: true });
  }
};

const readText = (editor: LexicalEditor) =>
  editor.getEditorState().read(() => $getRoot().getTextContent());

describe('TYPOGRAPHIC_TRANSFORMERS', () => {
  it('replaces "->" with "→"', () => {
    const editor = createProbeEditor();
    typeInto(editor, 'a->');
    expect(readText(editor)).toBe('a→');
  });

  it('replaces "<-" with "←"', () => {
    const editor = createProbeEditor();
    typeInto(editor, 'a<-');
    expect(readText(editor)).toBe('a←');
  });

  it('replaces "--" with "—"', () => {
    const editor = createProbeEditor();
    typeInto(editor, 'a--');
    expect(readText(editor)).toBe('a—');
  });

  it('reaches "→" from "-->" through the em-dash composition rule', () => {
    const editor = createProbeEditor();
    typeInto(editor, 'a-->');
    expect(readText(editor)).toBe('a→');
  });

  it('preserves the format bits of the node it substitutes into', () => {
    const editor = createProbeEditor();
    editor.update(
      () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) selection.formatText('bold');
      },
      { discrete: true },
    );

    typeInto(editor, 'a->');

    const nodes = editor.getEditorState().read(() =>
      $getRoot()
        .getAllTextNodes()
        .map((node) => ({
          text: node.getTextContent(),
          bold: node.hasFormat('bold'),
        })),
    );
    expect(nodes).toEqual([{ text: 'a→', bold: true }]);
  });
});
