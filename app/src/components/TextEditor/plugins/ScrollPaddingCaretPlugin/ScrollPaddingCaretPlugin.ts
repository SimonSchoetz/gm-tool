import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { SKIP_SCROLL_INTO_VIEW_TAG } from 'lexical';
import { revealCaretClearOfScrollPadding } from './helper/revealCaretClearOfScrollPadding';

export const ScrollPaddingCaretPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  // Lexical scrolls the caret into view itself after an update but reads scroll-padding only on the document, so a scroller with a fade would leave the caret's line inside it; this listener runs after Lexical's scroll in the same commit, on every update except one tagged to skip Lexical's caret scroll.
  useEffect(
    () =>
      editor.registerUpdateListener(({ tags }) => {
        if (tags.has(SKIP_SCROLL_INTO_VIEW_TAG)) return;
        revealCaretClearOfScrollPadding(editor.getRootElement());
      }),
    [editor],
  );

  return null;
};
