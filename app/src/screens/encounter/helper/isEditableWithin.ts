const EDITABLE_SELECTOR = 'input, textarea, [contenteditable="true"]';

export const isEditableWithin = (
  container: HTMLElement | null,
  target: EventTarget | null,
): boolean =>
  container !== null &&
  target instanceof Element &&
  container.contains(target) &&
  target.closest(EDITABLE_SELECTOR) !== null;
