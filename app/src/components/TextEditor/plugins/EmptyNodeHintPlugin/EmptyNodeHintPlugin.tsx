import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  BLUR_COMMAND,
  COMMAND_PRIORITY_LOW,
  FOCUS_COMMAND,
  mergeRegister,
} from 'lexical';
import './EmptyNodeHintPlugin.css';

const HINT_CLASS = 'editor-node--show-hint';

export const EmptyNodeHintPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const isFocusedRef = useRef(false);
  const hintedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const updateHint = () => {
      const nextElement = editor.getEditorState().read(() => {
        if (!isFocusedRef.current) return null;
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
          return null;
        }
        const anchorNode = selection.anchor.getNode();
        const element =
          anchorNode.getKey() === 'root'
            ? anchorNode
            : anchorNode.getTopLevelElementOrThrow();
        if (element.getTextContent().length > 0) return null;
        return editor.getElementByKey(element.getKey());
      });

      if (
        hintedElementRef.current &&
        hintedElementRef.current !== nextElement
      ) {
        hintedElementRef.current.classList.remove(HINT_CLASS);
      }
      if (nextElement) {
        nextElement.classList.add(HINT_CLASS);
      }
      hintedElementRef.current = nextElement;
    };

    return mergeRegister(
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          isFocusedRef.current = true;
          updateHint();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        () => {
          isFocusedRef.current = false;
          updateHint();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerUpdateListener(() => {
        updateHint();
      }),
    );
  }, [editor]);

  return null;
};
