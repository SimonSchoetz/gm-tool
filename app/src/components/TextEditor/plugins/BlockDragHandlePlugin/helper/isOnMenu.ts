export const isOnMenu = (element: HTMLElement): boolean =>
  element.closest('.block-drag-handle') !== null;
