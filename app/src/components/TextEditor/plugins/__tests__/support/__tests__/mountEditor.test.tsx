import { useEffect } from 'react';
import { describe, expect, it } from 'vitest';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import {
  body,
  makeEditor,
  outlineOfRoot,
  paragraph,
  setRootChildren,
} from '../toggleFixtures';
import { mountEditor, updateEditor } from '../mountEditor';
import { $createToggleNode } from '../../../../nodes/ToggleNode';

const MakesEditorReadOnly = () => {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.setEditable(false);
  }, [editor]);
  return null;
};

describe('mountEditor', () => {
  it('mounts the plugins it is given under the editor it returns', () => {
    const editor = mountEditor(<MakesEditorReadOnly />);

    expect(editor.isEditable()).toBe(false);
  });

  it('holds the saved state it is given', () => {
    const source = makeEditor();
    setRootChildren(source, () => [
      $createToggleNode().append(paragraph('Header'), body('One')),
    ]);

    const editor = mountEditor(
      null,
      JSON.stringify(source.getEditorState().toJSON()),
    );

    expect(outlineOfRoot(editor)).toEqual(['toggle[Header, body[One]]']);
  });

  it('applies an update a test makes after the mount', () => {
    const editor = mountEditor(null);

    updateEditor(editor, () => {
      $getRoot().clear().append(paragraph('After mount'));
    });

    expect(outlineOfRoot(editor)).toEqual(['After mount']);
  });
});
