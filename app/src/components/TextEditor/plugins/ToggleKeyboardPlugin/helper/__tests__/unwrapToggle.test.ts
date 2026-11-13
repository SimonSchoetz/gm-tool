import { describe, expect, it } from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $isTextNode,
  type LexicalEditor,
} from 'lexical';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { $createToggleNode, $isToggleNode } from '../../../../nodes/ToggleNode';
import { $createToggleBodyNode } from '../../../../nodes/ToggleBodyNode';
import { unwrapToggle } from '../unwrapToggle';
import {
  $bodyOf,
  $firstToggle,
  body,
  inEditor,
  makeEditor,
  outlineOfRoot,
  paragraph,
  rootBlockTypes,
  setRootChildren,
} from '../../../__tests__/support/toggleFixtures';

const unwrapFirstToggle = (editor: LexicalEditor) =>
  inEditor(editor, () => unwrapToggle($firstToggle()));

describe('unwrapToggle', () => {
  it('turns an open toggle into its header followed by the body blocks, in order, at the toggle place', () => {
    const editor = makeEditor();
    setRootChildren(editor, () => [
      $createToggleNode().append(paragraph('Header'), body('One', 'Two')),
      paragraph('After'),
    ]);

    unwrapFirstToggle(editor);

    expect(outlineOfRoot(editor)).toEqual(['Header', 'One', 'Two', 'After']);
  });

  it('unwraps a collapsed toggle the same way', () => {
    const editor = makeEditor();
    setRootChildren(editor, () => [
      $createToggleNode(true).append(paragraph('Header'), body('One', 'Two')),
    ]);

    unwrapFirstToggle(editor);

    expect(outlineOfRoot(editor)).toEqual(['Header', 'One', 'Two']);
  });

  it('returns the header block itself, a heading staying a heading of its level', () => {
    const editor = makeEditor();
    let headerKey = '';
    setRootChildren(editor, () => {
      const header = $createHeadingNode('h2').append($createTextNode('Header'));
      headerKey = header.getKey();
      return [$createToggleNode().append(header, body('One'))];
    });

    const returned = unwrapFirstToggle(editor);

    expect(returned.getKey()).toBe(headerKey);
    expect(rootBlockTypes(editor)).toEqual(['heading', 'paragraph']);
    expect(
      editor.read(() => ($isHeadingNode(returned) ? returned.getTag() : null)),
    ).toBe('h2');
  });

  it('keeps the formatted runs of the header', () => {
    const editor = makeEditor();
    setRootChildren(editor, () => [
      $createToggleNode().append(
        $createParagraphNode().append(
          $createTextNode('plain '),
          $createTextNode('bold').toggleFormat('bold'),
        ),
        body('One'),
      ),
    ]);

    const returned = unwrapFirstToggle(editor);

    expect(
      editor.read(() =>
        returned
          .getChildren()
          .filter($isTextNode)
          .map((child) => `${child.getTextContent()}:${child.getFormat()}`),
      ),
    ).toEqual(['plain :0', 'bold:1']);
  });

  it('leaves a toggle inside the body a toggle with its own header and body', () => {
    const editor = makeEditor();
    setRootChildren(editor, () => [
      $createToggleNode().append(
        paragraph('Header'),
        body('One').append(
          $createToggleNode().append(
            paragraph('Inner header'),
            body('Inner one'),
          ),
        ),
      ),
    ]);

    unwrapFirstToggle(editor);

    expect(outlineOfRoot(editor)).toEqual([
      'Header',
      'One',
      'toggle[Inner header, body[Inner one]]',
    ]);
  });

  it('keeps an empty header and an empty body paragraph as empty paragraphs', () => {
    const editor = makeEditor();
    setRootChildren(editor, () => [
      $createToggleNode().append(
        $createParagraphNode(),
        $createToggleBodyNode().append($createParagraphNode()),
      ),
    ]);

    unwrapFirstToggle(editor);

    expect(rootBlockTypes(editor)).toEqual(['paragraph', 'paragraph']);
    expect(outlineOfRoot(editor)).toEqual(['', '']);
  });

  it('unwraps a toggle in another toggle body into that body at its own position, the blocks around it keeping their order', () => {
    const editor = makeEditor();
    setRootChildren(editor, () => [
      $createToggleNode().append(
        paragraph('Outer header'),
        body('Before').append(
          $createToggleNode().append(
            paragraph('Inner header'),
            body('Inner one'),
          ),
          paragraph('After'),
        ),
      ),
    ]);

    inEditor(editor, () => {
      const inner = $bodyOf($firstToggle()).getChildAtIndex(1);
      if (!$isToggleNode(inner)) throw new Error('The block is not a toggle');
      return unwrapToggle(inner);
    });

    expect(outlineOfRoot(editor)).toEqual([
      'toggle[Outer header, body[Before, Inner header, Inner one, After]]',
    ]);
  });

  it('unwraps a toggle that has no body into its header', () => {
    const editor = makeEditor();
    setRootChildren(editor, () => [
      $createToggleNode().append(paragraph('Header')),
    ]);

    unwrapFirstToggle(editor);

    expect(outlineOfRoot(editor)).toEqual(['Header']);
  });
});
