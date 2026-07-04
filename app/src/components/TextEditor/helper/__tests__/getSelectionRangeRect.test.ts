import { describe, it, expect, vi, afterEach } from 'vitest';
import type { LexicalEditor } from 'lexical';
import { getSelectionRangeRect } from '../getSelectionRangeRect';

const makeEditor = (rootElement: HTMLElement | null): LexicalEditor =>
  ({ getRootElement: () => rootElement }) as unknown as LexicalEditor;

const makeSelection = (
  rangeCount: number,
  anchorNode: Node | null,
  rect: DOMRect,
) =>
  ({
    rangeCount,
    anchorNode,
    getRangeAt: () => ({ getBoundingClientRect: () => rect }),
  }) as unknown as Selection;

const makeRect = () =>
  ({ top: 1, left: 2, width: 3, height: 4 }) as unknown as DOMRect;

describe('getSelectionRangeRect', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when there is no native selection', () => {
    vi.spyOn(window, 'getSelection').mockReturnValue(null);
    expect(
      getSelectionRangeRect(makeEditor(document.createElement('div'))),
    ).toBe(null);
  });

  it('returns null when the selection has no ranges', () => {
    const anchorNode = document.createElement('span');
    vi.spyOn(window, 'getSelection').mockReturnValue(
      makeSelection(0, anchorNode, makeRect()),
    );
    expect(
      getSelectionRangeRect(makeEditor(document.createElement('div'))),
    ).toBe(null);
  });

  it('returns null when the editor has no root element', () => {
    const anchorNode = document.createElement('span');
    vi.spyOn(window, 'getSelection').mockReturnValue(
      makeSelection(1, anchorNode, makeRect()),
    );
    expect(getSelectionRangeRect(makeEditor(null))).toBe(null);
  });

  it('returns null when the selection anchor is outside the editor root', () => {
    const rootElement = document.createElement('div');
    const anchorNode = document.createElement('span');
    vi.spyOn(window, 'getSelection').mockReturnValue(
      makeSelection(1, anchorNode, makeRect()),
    );
    expect(getSelectionRangeRect(makeEditor(rootElement))).toBe(null);
  });

  it('returns the range bounding rect when the selection anchor is inside the editor root', () => {
    const rootElement = document.createElement('div');
    const anchorNode = document.createElement('span');
    rootElement.appendChild(anchorNode);
    const rect = makeRect();
    vi.spyOn(window, 'getSelection').mockReturnValue(
      makeSelection(1, anchorNode, rect),
    );
    expect(getSelectionRangeRect(makeEditor(rootElement))).toBe(rect);
  });
});
