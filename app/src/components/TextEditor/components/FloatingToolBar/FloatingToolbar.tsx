import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  TextFormatType,
} from 'lexical';
import { mergeRegister } from '@lexical/utils';
import './FloatingToolbar.css';
import { TextFormatBtn } from './components';
import { textFormatBtns } from './textFormatConfig';

const VERTICAL_GAP = 24;

type Position = {
  top: number;
  left: number;
};

export const FloatingToolbar = ({ ...props }) => {
  const [editor] = useLexicalComposerContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const [activeFormats, setActiveFormats] = useState<
    Partial<Record<TextFormatType, boolean>>
  >({});

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

    // Update active formats for all buttons
    const formats: Partial<Record<TextFormatType, boolean>> = {};
    textFormatBtns.forEach((btn) => {
      formats[btn.formatType] = selection.hasFormat(btn.formatType);
    });
    setActiveFormats(formats);

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
      {textFormatBtns.map((btn) => (
        <TextFormatBtn
          key={btn.formatType}
          label={btn.label}
          formatType={btn.formatType}
          icon={btn.icon}
          isActive={activeFormats[btn.formatType] ?? false}
        />
      ))}
    </div>,
    document.body
  );
};
