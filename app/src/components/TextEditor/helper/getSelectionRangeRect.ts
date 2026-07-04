import { LexicalEditor } from 'lexical';

export const getSelectionRangeRect = (
  editor: LexicalEditor,
): DOMRect | null => {
  const nativeSelection = window.getSelection();
  const rootElement = editor.getRootElement();
  if (
    nativeSelection &&
    nativeSelection.rangeCount > 0 &&
    rootElement?.contains(nativeSelection.anchorNode)
  ) {
    return nativeSelection.getRangeAt(0).getBoundingClientRect();
  }
  return null;
};
