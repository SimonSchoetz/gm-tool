import { describe, it, expect } from 'vitest';
import {
  $createParagraphNode,
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  createEditor,
} from 'lexical';
import {
  $createToggleNode,
  $createToggleBodyNode,
  ToggleNode,
  ToggleBodyNode,
} from '../../../../nodes';
import { resolveHeaderToggleForRemoval } from '../resolveHeaderToggleForRemoval';

const makeEditor = () => createEditor({ nodes: [ToggleNode, ToggleBodyNode] });

const readResolution = (editor: ReturnType<typeof createEditor>) =>
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return null;
    return resolveHeaderToggleForRemoval(selection);
  });

describe('resolveHeaderToggleForRemoval', () => {
  it('returns null for a collapsed selection', () => {
    const editor = makeEditor();
    let headerTextKey = '';
    editor.update(
      () => {
        const headerText = $createTextNode('Header');
        headerTextKey = headerText.getKey();
        const header = $createParagraphNode().append(headerText);
        const body = $createToggleBodyNode().append(
          $createParagraphNode().append($createTextNode('Body')),
        );
        const toggle = $createToggleNode().append(header, body);
        $getRoot().append(toggle);
        headerText.select(0, 0);
      },
      { discrete: true },
    );
    expect(headerTextKey).not.toBe('');
    expect(readResolution(editor)).toBeNull();
  });

  it('returns null when the selection starts inside the header', () => {
    const editor = makeEditor();
    editor.update(
      () => {
        const headerText = $createTextNode('Header');
        const header = $createParagraphNode().append(headerText);
        const body = $createToggleBodyNode().append(
          $createParagraphNode().append($createTextNode('Body')),
        );
        const toggle = $createToggleNode().append(header, body);
        $getRoot().append(toggle);
        headerText.select(0, 3);
      },
      { discrete: true },
    );
    expect(readResolution(editor)).toBeNull();
  });

  it('returns null when the selection starts inside the body', () => {
    const editor = makeEditor();
    editor.update(
      () => {
        const headerText = $createTextNode('Header');
        const header = $createParagraphNode().append(headerText);
        const bodyText = $createTextNode('Body');
        const body = $createToggleBodyNode().append(
          $createParagraphNode().append(bodyText),
        );
        const toggle = $createToggleNode().append(header, body);
        $getRoot().append(toggle);
        bodyText.select(0, 2);
      },
      { discrete: true },
    );
    expect(readResolution(editor)).toBeNull();
  });

  it('returns null when the selection never touches a toggle header', () => {
    const editor = makeEditor();
    editor.update(
      () => {
        const beforeText = $createTextNode('before');
        const before = $createParagraphNode().append(beforeText);
        $getRoot().append(before);
        beforeText.select(0, 3);
      },
      { discrete: true },
    );
    expect(readResolution(editor)).toBeNull();
  });

  it('returns the ToggleNode when the selection starts outside the toggle and covers part of the header', () => {
    const editor = makeEditor();
    let toggleKey = '';
    editor.update(
      () => {
        const beforeText = $createTextNode('before');
        const before = $createParagraphNode().append(beforeText);

        const headerText = $createTextNode('Header');
        const header = $createParagraphNode().append(headerText);
        const body = $createToggleBodyNode().append(
          $createParagraphNode().append($createTextNode('Body')),
        );
        const toggle = $createToggleNode().append(header, body);
        toggleKey = toggle.getKey();

        $getRoot().append(before, toggle);

        const selection = $createRangeSelection();
        selection.anchor.set(beforeText.getKey(), 0, 'text');
        selection.focus.set(headerText.getKey(), 2, 'text');
        $setSelection(selection);
      },
      { discrete: true },
    );

    const result = readResolution(editor);
    expect(result).not.toBeNull();
    expect(result?.getKey()).toBe(toggleKey);
  });
});
