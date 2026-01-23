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

type Position = {
  top: number;
  left: number;
};

const initPosition: Position = { top: 0, left: 0 };

export const FloatingToolbar = ({ ...props }) => {
  const [editor] = useLexicalComposerContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>(initPosition);
  const [cursorPosition, setCursorPosition] = useState<Position>(initPosition);

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

    setPosition({
      top: cursorPosition.top + window.scrollY,
      left: cursorPosition.left + window.scrollX,
    });

    setIsVisible(true);
  }, [cursorPosition]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      setCursorPosition({
        top: event.clientY,
        left: event.clientX,
      });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
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
