import type { DropTarget } from './resolveDropTarget';

// Makes the drop gap read as the document making room by pushing the margin the target names open: a direct inline-style write on a Lexical-managed node, safe because Lexical's reconciler skips a node's DOM entirely when it isn't dirty (Lexical.dev.mjs:3414), so it survives unless the block itself is edited mid-drag. The transition lives in TextEditor.css. Holds the margin it pushed, so a push elsewhere or a clear puts that one back.
export const createMarginPush = (): {
  push: (target: Pick<DropTarget, 'gap'>) => void;
  clear: () => void;
} => {
  let pushed: {
    element: HTMLElement;
    margin: 'marginTop' | 'marginBottom';
  } | null = null;

  const clear = () => {
    if (pushed === null) return;
    pushed.element.style[pushed.margin] = '';
    pushed = null;
  };

  const push = (target: Pick<DropTarget, 'gap'>) => {
    const { element, margin } = target.gap;
    if (pushed?.element === element && pushed.margin === margin) return;
    clear();
    element.style[margin] = 'var(--spacing-xl)';
    pushed = { element, margin };
  };

  return { push, clear };
};
