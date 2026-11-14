import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { revealCaretClearOfScrollPadding } from './helper/revealCaretClearOfScrollPadding';

export const ScrollPaddingCaretPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  // Lexical scrolls the caret into view itself after an update but reads scroll-padding only on the document, so a scroller with a fade would leave the caret's line inside it; this listener runs after Lexical's scroll in the same commit.
  useEffect(
    () =>
      editor.registerUpdateListener((update) => {
        revealCaretClearOfScrollPadding(editor, update);
      }),
    [editor],
  );

  return null;
};
