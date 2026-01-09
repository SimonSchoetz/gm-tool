import { FCProps } from '@/types';
import { BoldIcon, ItalicIcon } from 'lucide-react';
import { ActionContainer } from '@/components';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import './FloatingToolbar.css';

type Props = object;

const VERTICAL_GAP = 24;

type Position = {
  top: number;
  left: number;
};

export const FloatingToolbar: FCProps<Props> = ({ ...props }) => {
  const [editor] = useLexicalComposerContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) {
      setIsVisible(false);
      return;
    }

    const nativeSelection = window.getSelection();
    if (
      !nativeSelection ||
      nativeSelection.rangeCount === 0 ||
      selection.isCollapsed()
    ) {
      setIsVisible(false);
      return;
    }

    // Get native selection rect for positioning
    const domRange = nativeSelection.getRangeAt(0);
    const rect = domRange.getBoundingClientRect();

    if (rect.width === 0 && rect.height === 0) {
      setIsVisible(false);
      return;
    }

    // Update active states
    setIsBold(selection.hasFormat('bold'));
    setIsItalic(selection.hasFormat('italic'));

    // Calculate position
    setPosition({
      top: rect.top + window.scrollY + VERTICAL_GAP,
      left: rect.left + window.scrollX + rect.width / 2,
    });

    setIsVisible(true);
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, updateToolbar]);

  const handleFormat = (format: 'bold' | 'italic') => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  if (!isVisible) {
    return null;
  }

  return createPortal(
    <div
      className='floating-toolbar'
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      {...props}
    >
      <ActionContainer
        label='Bold'
        onClick={() => handleFormat('bold')}
        data-active={isBold}
      >
        <BoldIcon size={18} />
      </ActionContainer>
      <ActionContainer
        label='Italic'
        onClick={() => handleFormat('italic')}
        data-active={isItalic}
      >
        <ItalicIcon size={18} />
      </ActionContainer>
    </div>,
    document.body
  );
};
