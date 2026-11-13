import { describe, expect, it } from 'vitest';
import { $getNodeByKey } from 'lexical';
import { $isListItemNode } from '@lexical/list';
import {
  keyOf,
  list,
  makeEditor,
  outlineOf,
  paragraph,
  rootListKeyOf,
  toggle,
} from '../editorFixtures';

const makeDocument = () =>
  makeEditor(() => [
    paragraph('p'),
    toggle('T', [paragraph('x'), toggle('U', [paragraph('y')])]),
    list('bullet', [
      { text: 'a', children: [{ text: 'a1', children: [{ text: 'a1i' }] }] },
      { text: 'b' },
    ]),
    list('check', [{ text: 'c', checked: true }, { text: 'd' }]),
  ]);

describe('editorFixtures', () => {
  it('outlines paragraphs, toggles with their bodies, and lists with sub-items and check marks', () => {
    expect(outlineOf(makeDocument())).toEqual([
      'p',
      'T{x,U{y}}',
      'bullet(a[a1[a1i]],b)',
      'check(✓c,☐d)',
    ]);
  });

  it('finds a paragraph, a toggle by its header, a nested block and a list item by its text', () => {
    const editor = makeDocument();

    const typeOf = (text: string) =>
      editor.read('latest', () =>
        $getNodeByKey(keyOf(editor, text))?.getType(),
      );

    expect(typeOf('p')).toBe('paragraph');
    expect(typeOf('T')).toBe('toggle');
    expect(typeOf('y')).toBe('paragraph');
    expect(typeOf('a1i')).toBe('listitem');
    expect(() => keyOf(editor, 'missing')).toThrow(
      /^no block with text missing$/,
    );
  });

  it('builds a nested list with each item at the depth of its spec', () => {
    const editor = makeDocument();

    const depths = editor.read('latest', () =>
      ['a', 'a1', 'a1i', 'b'].map((text) => {
        const node = $getNodeByKey(keyOf(editor, text));
        return $isListItemNode(node) ? node.getIndent() : -1;
      }),
    );

    expect(depths).toEqual([0, 1, 2, 0]);
  });

  it('finds the outermost list that holds an item at any depth', () => {
    const editor = makeDocument();

    const typeAndText = (text: string) =>
      editor.read('latest', () => {
        const node = $getNodeByKey(rootListKeyOf(editor, text));
        return `${node?.getType()}:${node?.getTextContent().slice(0, 1)}`;
      });

    expect(typeAndText('a1i')).toBe(typeAndText('a'));
    expect(typeAndText('c')).not.toBe(typeAndText('a'));
    expect(() => rootListKeyOf(editor, 'p')).toThrow(/^no list holds p$/);
  });
});
