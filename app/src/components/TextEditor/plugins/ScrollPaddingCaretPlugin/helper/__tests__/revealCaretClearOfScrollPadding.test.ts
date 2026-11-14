import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { LexicalEditor } from 'lexical';
import { revealCaretClearOfScrollPadding } from '../revealCaretClearOfScrollPadding';

type Edges = { top: number; bottom: number };
type Padding = { top: string; bottom: string };

const SCROLL_PADDING = 24;
const FADE = `${SCROLL_PADDING}px`;
const scrollPaddings = new Map<Element, Padding>();

// jsdom computes no layout, so every element gets the rect a test gives it and a scrollTop that starts where the test puts it and moves up to `maxScroll`.
const placeElement = (
  parent: HTMLElement,
  edges: Edges,
  { initialScroll = 0, maxScroll = Number.POSITIVE_INFINITY } = {},
): HTMLElement => {
  const element = document.createElement('div');
  element.getBoundingClientRect = () =>
    ({ ...edges, height: edges.bottom - edges.top }) as DOMRect;
  let scrollTop = initialScroll;
  Object.defineProperty(element, 'scrollTop', {
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = Math.min(Math.max(value, 0), maxScroll);
    },
  });
  parent.appendChild(element);
  return element;
};

const stubSelection = (
  startContainer: Node,
  rect: Edges,
  { isCollapsed = true, rangeCount = 1 } = {},
) => {
  vi.spyOn(window, 'getSelection').mockReturnValue({
    rangeCount,
    isCollapsed,
    getRangeAt: () => ({
      startContainer,
      getBoundingClientRect: () => ({
        ...rect,
        height: rect.bottom - rect.top,
      }),
    }),
  } as unknown as Selection);
};

type SelectionStub = { is: (other: unknown) => boolean };
const unchangedSelection: SelectionStub = { is: () => true };
const changedSelection: SelectionStub = { is: () => false };

type UpdateOptions = {
  editable?: boolean;
  tags?: string[];
  dirtyElements?: string[];
  dirtyLeaves?: string[];
  selection?: SelectionStub | null;
};

// What Lexical hands an update listener, with the parts the driver reads: by default one changed leaf and an unchanged selection.
const reveal = (
  root: HTMLElement | null,
  {
    editable = true,
    tags = [],
    dirtyElements = [],
    dirtyLeaves = ['leaf'],
    selection = unchangedSelection,
  }: UpdateOptions = {},
) => {
  const editor = {
    isEditable: () => editable,
    getRootElement: () => root,
  } as unknown as LexicalEditor;
  const update = {
    tags: new Set(tags),
    dirtyElements: new Map(dirtyElements.map((key) => [key, true])),
    dirtyLeaves: new Set(dirtyLeaves),
    editorState: { read: () => selection },
    prevEditorState: { read: () => null },
  } as unknown as Parameters<typeof revealCaretClearOfScrollPadding>[1];
  revealCaretClearOfScrollPadding(editor, update);
};

describe('revealCaretClearOfScrollPadding', () => {
  beforeEach(() => {
    scrollPaddings.clear();
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
      const padding = scrollPaddings.get(element);
      return {
        scrollPaddingTop: padding?.top ?? 'auto',
        scrollPaddingBottom: padding?.bottom ?? 'auto',
      } as CSSStyleDeclaration;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.replaceChildren();
  });

  const mountFocusedRoot = (scroller: HTMLElement, edges: Edges) => {
    const root = placeElement(scroller, edges);
    root.tabIndex = 0;
    root.focus();
    return root;
  };

  const mountFadedScroller = (
    padding: Padding = { top: FADE, bottom: FADE },
  ) => {
    const scroller = placeElement(document.body, { top: 100, bottom: 300 });
    scrollPaddings.set(scroller, padding);
    const root = mountFocusedRoot(scroller, { top: 100, bottom: 300 });
    return { scroller, root };
  };

  it.each([
    ['the editor is not editable', { editable: false }],
    ['the update skips the DOM selection', { tags: ['skip-dom-selection'] }],
    [
      'the update skips the scroll into view',
      { tags: ['skip-scroll-into-view'] },
    ],
    [
      'no node changed and the selection did not',
      { dirtyLeaves: [], selection: unchangedSelection },
    ],
    [
      'no node changed and there is no selection',
      { dirtyLeaves: [], selection: null },
    ],
  ])(
    'scrolls nothing when %s, as Lexical itself does not scroll',
    (_name, options) => {
      const { scroller, root } = mountFadedScroller();
      stubSelection(root, { top: 280, bottom: 300 });

      reveal(root, options);

      expect(scroller.scrollTop).toBe(0);
    },
  );

  it.each([
    ['a changed element', { dirtyLeaves: [], dirtyElements: ['p'] }],
    ['a changed leaf', { dirtyLeaves: ['text'] }],
    [
      'a changed selection with no changed node',
      { dirtyLeaves: [], selection: changedSelection },
    ],
  ])(
    'moves the scroller for %s, as Lexical itself scrolls',
    (_name, options) => {
      const { scroller, root } = mountFadedScroller();
      const caret = { top: 280, bottom: 300 };
      stubSelection(root, caret);

      reveal(root, options);

      expect(scroller.scrollTop).toBe(caret.bottom - (300 - SCROLL_PADDING));
    },
  );

  it('does nothing without a root element', () => {
    stubSelection(document.body, { top: 280, bottom: 300 });

    expect(() => {
      reveal(null);
    }).not.toThrow();
  });

  it('leaves the scroller alone when the root is not the focused element', () => {
    const scroller = placeElement(document.body, { top: 100, bottom: 300 });
    scrollPaddings.set(scroller, { top: FADE, bottom: FADE });
    const root = placeElement(scroller, { top: 100, bottom: 300 });
    stubSelection(root, { top: 280, bottom: 300 });

    reveal(root);

    expect(scroller.scrollTop).toBe(0);
  });

  it.each([
    ['there is no selection', null],
    ['the selection has no range', { rangeCount: 0 }],
    ['the selection is not collapsed', { isCollapsed: false }],
  ])('scrolls nothing when %s', (_name, selection) => {
    const { scroller, root } = mountFadedScroller();
    if (selection === null) {
      vi.spyOn(window, 'getSelection').mockReturnValue(null);
    } else {
      stubSelection(root, { top: 280, bottom: 300 }, selection);
    }

    reveal(root);

    expect(scroller.scrollTop).toBe(0);
  });

  it('scrolls nothing for a caret outside the editor', () => {
    const { scroller, root } = mountFadedScroller();
    const elsewhere = placeElement(document.body, { top: 0, bottom: 10 });
    stubSelection(elsewhere, { top: 280, bottom: 300 });

    reveal(root);

    expect(scroller.scrollTop).toBe(0);
  });

  it('moves the scroller by what brings a caret in the bottom fade clear of it', () => {
    const { scroller, root } = mountFadedScroller();
    const caret = { top: 280, bottom: 300 };
    stubSelection(root, caret);

    reveal(root);

    expect(scroller.scrollTop).toBe(caret.bottom - (300 - SCROLL_PADDING));
  });

  it('moves the scroller back by what brings a caret in the top fade clear of it', () => {
    const { scroller, root } = mountFadedScroller();
    scroller.scrollTop = 50;
    const caret = { top: 110, bottom: 130 };
    stubSelection(root, caret);

    reveal(root);

    expect(scroller.scrollTop).toBe(50 + (caret.top - (100 + SCROLL_PADDING)));
  });

  it('does not move a scroller whose caret is already clear of the fade', () => {
    const { scroller, root } = mountFadedScroller();
    stubSelection(root, { top: 180, bottom: 200 });

    reveal(root);

    expect(scroller.scrollTop).toBe(0);
  });

  it.each([
    ['auto', { top: 'auto', bottom: 'auto' }],
    ['0px', { top: '0px', bottom: '0px' }],
  ])(
    'does not move an ancestor whose scroll padding is %s, however far the caret lies beyond it',
    (_name, padding) => {
      const { scroller, root } = mountFadedScroller(padding);
      stubSelection(root, { top: 310, bottom: 330 });

      reveal(root);

      expect(scroller.scrollTop).toBe(0);
      expect(root.scrollTop).toBe(0);
    },
  );

  it('does not measure the caret while no ancestor has scroll padding', () => {
    const { root } = mountFadedScroller({ top: 'auto', bottom: 'auto' });
    const measureCaret = vi.fn(() => ({ top: 280, bottom: 300, height: 20 }));
    vi.spyOn(window, 'getSelection').mockReturnValue({
      rangeCount: 1,
      isCollapsed: true,
      getRangeAt: () => ({
        startContainer: root,
        getBoundingClientRect: measureCaret,
      }),
    } as unknown as Selection);

    reveal(root);

    expect(measureCaret).not.toHaveBeenCalled();
  });

  it('honours the top padding of a scroller that has none at the bottom', () => {
    const { scroller, root } = mountFadedScroller({
      top: FADE,
      bottom: 'auto',
    });
    scroller.scrollTop = 50;
    const caret = { top: 110, bottom: 130 };
    stubSelection(root, caret);

    reveal(root);

    expect(scroller.scrollTop).toBe(50 + (caret.top - (100 + SCROLL_PADDING)));
  });

  it('honours the bottom padding of a scroller that has none at the top', () => {
    const { scroller, root } = mountFadedScroller({
      top: 'auto',
      bottom: FADE,
    });
    const caret = { top: 280, bottom: 300 };
    stubSelection(root, caret);

    reveal(root);

    expect(scroller.scrollTop).toBe(caret.bottom - (300 - SCROLL_PADDING));
  });

  it('keeps the top padding out of the bottom edge', () => {
    const { scroller, root } = mountFadedScroller({
      top: FADE,
      bottom: 'auto',
    });
    stubSelection(root, { top: 280, bottom: 300 });

    reveal(root);

    expect(scroller.scrollTop).toBe(0);
  });

  it('keeps the bottom padding out of the top edge', () => {
    const { scroller, root } = mountFadedScroller({
      top: 'auto',
      bottom: FADE,
    });
    scroller.scrollTop = 50;
    stubSelection(root, { top: 110, bottom: 130 });

    reveal(root);

    expect(scroller.scrollTop).toBe(50);
  });

  it('measures the element holding the caret when the collapsed range in a text node has no height', () => {
    const { scroller, root } = mountFadedScroller();
    const line = placeElement(root, { top: 270, bottom: 290 });
    const text = document.createTextNode('');
    line.appendChild(text);
    stubSelection(text, { top: 0, bottom: 0 });

    reveal(root);

    expect(scroller.scrollTop).toBe(290 - (300 - SCROLL_PADDING));
  });

  it('measures the starting element itself when the collapsed range in an element has no height', () => {
    const { scroller, root } = mountFadedScroller();
    const line = placeElement(root, { top: 270, bottom: 290 });
    stubSelection(line, { top: 0, bottom: 0 });

    reveal(root);

    expect(scroller.scrollTop).toBe(290 - (300 - SCROLL_PADDING));
  });

  it('shifts the caret by what an inner scroller moved before the outer one is measured', () => {
    const outer = placeElement(document.body, { top: 50, bottom: 290 });
    scrollPaddings.set(outer, { top: FADE, bottom: FADE });
    const inner = placeElement(
      outer,
      { top: 100, bottom: 300 },
      { initialScroll: 5, maxScroll: 15 },
    );
    scrollPaddings.set(inner, { top: FADE, bottom: FADE });
    const root = mountFocusedRoot(inner, { top: 100, bottom: 300 });
    const caret = { top: 280, bottom: 300 };
    stubSelection(root, caret);

    reveal(root);

    expect(inner.scrollTop).toBe(15);
    expect(outer.scrollTop).toBe(caret.bottom - 10 - (290 - SCROLL_PADDING));
  });

  it('leaves the document body to Lexical', () => {
    const { root } = mountFadedScroller();
    scrollPaddings.set(document.body, { top: FADE, bottom: FADE });
    const bodyScrollTop = vi.fn();
    Object.defineProperty(document.body, 'scrollTop', {
      configurable: true,
      get: () => 0,
      set: bodyScrollTop,
    });
    stubSelection(root, { top: 280, bottom: 300 });

    reveal(root);

    expect(bodyScrollTop).not.toHaveBeenCalled();
  });
});
