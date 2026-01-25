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
import { TextFormatBtn, HeadingBtn } from './components';
import { textFormatBtns, headingBtns } from './toolbarConfig';
import { cn } from '@/util';

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
  const [selected, setSelected] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

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

    const selectedText = nativeSelection.toString();
    if (!selectedText || selectedText.length === 0) {
      setIsVisible(false);
      return;
    }

    // Hide toolbar if editor is not focused
    if (!isFocused) {
      setIsVisible(false);
      return;
    }

    if (selected !== selectedText) {
      setSelected(selectedText);

      setPosition({
        top: cursorPosition.top + window.scrollY,
        left: cursorPosition.left + window.scrollX,
      });
    }

    setIsVisible(true);
  }, [cursorPosition, isFocused, selected]);

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
    // Track editor focus state
    const rootElement = editor.getRootElement();

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => {
      setIsFocused(false);
      setIsVisible(false);
    };

    if (rootElement) {
      rootElement.addEventListener('focus', handleFocus);
      rootElement.addEventListener('blur', handleBlur);
    }

    return () => {
      if (rootElement) {
        rootElement.removeEventListener('focus', handleFocus);
        rootElement.removeEventListener('blur', handleBlur);
      }
    };
  }, [editor]);

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
      onMouseDown={(e) => e.preventDefault()}
      {...props}
    >
      {headingBtns.map((btn) => (
        <HeadingBtn
          key={btn.headingType}
          label={btn.label}
          headingType={btn.headingType}
          icon={btn.icon}
        />
      ))}
      <Divider />
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

const Divider = () => {
  return <div className={cn('divider')}></div>;
};
