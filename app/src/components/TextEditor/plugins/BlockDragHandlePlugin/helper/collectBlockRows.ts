import { $getRoot } from 'lexical';
import type { LexicalEditor, NodeKey } from 'lexical';

// One block the pointer can pick up or drop beside, with the layout the resolvers read: client coordinates of its rectangle and its computed margins.
export type BlockRow = {
  key: NodeKey;
  element: HTMLElement;
  top: number;
  bottom: number;
  marginTop: number;
  marginBottom: number;
};

// A margin the stylesheet leaves unset computes to an empty string, which parses to NaN.
const marginInPixels = (value: string): number => Number.parseFloat(value) || 0;

// The one place that reads layout: every resolver downstream is pure over the rows this returns.
export const collectBlockRows = (editor: LexicalEditor): BlockRow[] =>
  editor.read('latest', () =>
    $getRoot()
      .getChildrenKeys()
      .flatMap((key) => {
        const element = editor.getElementByKey(key);
        if (element === null) return [];
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return [
          {
            key,
            element,
            top: rect.top,
            bottom: rect.bottom,
            marginTop: marginInPixels(style.marginTop),
            marginBottom: marginInPixels(style.marginBottom),
          },
        ];
      }),
  );
