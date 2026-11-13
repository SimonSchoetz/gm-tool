// Sets the row's element as the drag image. The element sits on its own compositing layer while the browser captures it, which keeps the borders the browser would otherwise paint around the image off it; its own transform is put back once the capture is done.
export const setDragImageOfRow = (
  dataTransfer: Pick<DataTransfer, 'setDragImage'>,
  element: HTMLElement,
): void => {
  const previousTransform = element.style.transform;
  element.style.transform = 'translateZ(0)';
  dataTransfer.setDragImage(element, 0, 0);
  setTimeout(() => {
    element.style.transform = previousTransform;
  });
};
