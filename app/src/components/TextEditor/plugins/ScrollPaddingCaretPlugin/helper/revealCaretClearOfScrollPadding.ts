import { computeCaretScrollDelta } from './computeCaretScrollDelta';

type ScrollPaddedAncestor = {
  element: HTMLElement;
  paddingTop: number;
  paddingBottom: number;
};

export const revealCaretClearOfScrollPadding = (
  rootElement: HTMLElement | null,
): void => {
  if (rootElement === null) return;
  if (rootElement.ownerDocument.activeElement !== rootElement) return;

  const selection = window.getSelection();
  if (selection === null || selection.rangeCount === 0) return;
  if (!selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  if (!rootElement.contains(range.startContainer)) return;

  const scrollPaddedAncestors: ScrollPaddedAncestor[] = [];
  const documentBody = rootElement.ownerDocument.body;
  for (
    let ancestor: HTMLElement | null = rootElement;
    ancestor !== null && ancestor !== documentBody;
    ancestor = ancestor.parentElement
  ) {
    const style = window.getComputedStyle(ancestor);
    // `auto`, the value of every element that does not opt in, parses to NaN and reads as 0.
    const paddingTop = Number.parseFloat(style.scrollPaddingTop) || 0;
    const paddingBottom = Number.parseFloat(style.scrollPaddingBottom) || 0;
    if (paddingTop <= 0 && paddingBottom <= 0) continue;
    scrollPaddedAncestors.push({
      element: ancestor,
      paddingTop,
      paddingBottom,
    });
  }
  // The caret is measured only once an ancestor has opted in, since measuring it forces a layout on every update of every editor.
  if (scrollPaddedAncestors.length === 0) return;

  let caret = range.getBoundingClientRect();
  if (caret.height === 0) {
    // A collapsed range on an empty line measures as all zero, so the line's own element stands in for the caret.
    const holder =
      range.startContainer instanceof HTMLElement
        ? range.startContainer
        : (range.startContainer.parentElement ?? rootElement);
    caret = holder.getBoundingClientRect();
  }

  let top = caret.top;
  let bottom = caret.bottom;
  for (const { element, paddingTop, paddingBottom } of scrollPaddedAncestors) {
    const delta = computeCaretScrollDelta(
      { top, bottom },
      element.getBoundingClientRect(),
      paddingTop,
      paddingBottom,
    );
    const scrollTopBefore = element.scrollTop;
    element.scrollTop += delta;
    const applied = element.scrollTop - scrollTopBefore;
    top -= applied;
    bottom -= applied;
  }
};
