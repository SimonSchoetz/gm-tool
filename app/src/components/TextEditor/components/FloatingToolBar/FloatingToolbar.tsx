import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import './FloatingToolbar.css';
import { TextFormatBtn, NodeTypeBtn } from './components';
import { textFormatBtns, nodeTypeBtns } from './textFormatConfig';

const VERTICAL_GAP = 24;

type Position = {
  top: number;
  left: number;
};

export const FloatingToolbar = ({ ...props }) => {
  const [editor] = useLexicalComposerContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) {
      setIsVisible(false);
      return;
    }

    const nativeSelection = window.getSelection();
    if (!nativeSelection || nativeSelection.rangeCount === 0) {
      setIsVisible(false);
      return;
    }

    // Check if there's actual text selected
    const selectedText = nativeSelection.toString();
    if (!selectedText || selectedText.length === 0) {
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
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, updateToolbar]);

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
      {nodeTypeBtns.map((btn) => (
        <NodeTypeBtn
          key={btn.nodeType}
          label={btn.label}
          nodeType={btn.nodeType}
          icon={btn.icon}
        />
      ))}
      {textFormatBtns.map((btn) => (
        <TextFormatBtn
          key={btn.formatType}
          label={btn.label}
          formatType={btn.formatType}
          icon={btn.icon}
        />
      ))}
    </div>,
    document.body,
  );
};
