// Mirrors DraggableBlockPlugin_EXPERIMENTAL's own internal targetCalculateHeight math (parsed line-height, falling back to the element's full rendered height) so the menuRef anchor always measures the exact value Lexical's own vertical-centering formula expects for the hovered block, keeping its computed offset at zero regardless of block type or line count.
export const getTargetCalculateHeight = (element: HTMLElement): number => {
  const parsedLineHeight = parseInt(getComputedStyle(element).lineHeight, 10);
  return Number.isNaN(parsedLineHeight)
    ? element.getBoundingClientRect().height
    : parsedLineHeight;
};
