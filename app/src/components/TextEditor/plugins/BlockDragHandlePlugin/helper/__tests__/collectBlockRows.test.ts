import { afterEach, describe, expect, it } from 'vitest';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  createEditor,
} from 'lexical';
import type { LexicalEditor } from 'lexical';
import { collectBlockRows } from '../collectBlockRows';

const rootElements: HTMLElement[] = [];

afterEach(() => {
  rootElements.splice(0).forEach((element) => {
    element.remove();
  });
});

const makeEditor = (
  texts: string[],
  { rendered }: { rendered: boolean },
): LexicalEditor => {
  const editor = createEditor();
  if (rendered) {
    const rootElement = document.createElement('div');
    document.body.appendChild(rootElement);
    rootElements.push(rootElement);
    editor.setRootElement(rootElement);
  }
  editor.update(
    () => {
      texts.forEach((text) =>
        $getRoot().append($createParagraphNode().append($createTextNode(text))),
      );
    },
    { discrete: true },
  );
  return editor;
};

const topLevelKeys = (editor: LexicalEditor): string[] =>
  editor.read('latest', () => $getRoot().getChildrenKeys());

describe('collectBlockRows', () => {
  it('returns one row per top-level block in document order, each with its node key and rendered element', () => {
    const editor = makeEditor(['a', 'b', 'c'], { rendered: true });

    const rows = collectBlockRows(editor);

    expect(rows.map(({ key }) => key)).toEqual(topLevelKeys(editor));
    expect(rows.map(({ element }) => element)).toEqual(
      topLevelKeys(editor).map((key) => editor.getElementByKey(key)),
    );
  });

  it('returns no rows for blocks whose element is not rendered', () => {
    const editor = makeEditor(['a', 'b'], { rendered: false });

    expect(collectBlockRows(editor)).toEqual([]);
  });

  it('carries each row element rectangle top and bottom and computed margins as numbers, an unset margin as 0', () => {
    const editor = makeEditor(['a', 'b'], { rendered: true });
    const [firstKey, secondKey] = topLevelKeys(editor);
    const first = editor.getElementByKey(firstKey);
    const second = editor.getElementByKey(secondKey);
    if (first === null || second === null)
      throw new Error('block not rendered');
    first.getBoundingClientRect = () => ({ top: 10, bottom: 50 }) as DOMRect;
    first.style.marginTop = '6px';
    first.style.marginBottom = '12px';
    second.getBoundingClientRect = () => ({ top: 62, bottom: 90 }) as DOMRect;

    const [firstRow, secondRow] = collectBlockRows(editor);

    expect(firstRow).toMatchObject({
      top: 10,
      bottom: 50,
      marginTop: 6,
      marginBottom: 12,
    });
    expect(secondRow).toMatchObject({
      top: 62,
      bottom: 90,
      marginTop: 0,
      marginBottom: 0,
    });
  });
});
