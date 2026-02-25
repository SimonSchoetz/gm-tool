import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
  mergeRegister,
} from 'lexical';
import './FloatingToolbar.css';
import { TextFormatBtn, HeadingBtn, ListBtn } from './components';
import { textFormatBtns, headingBtns, listBtns } from './toolbarConfig';
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
  const toolbarRef = useRef<HTMLDivElement>(null);

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

    if (!isFocused) {
      setIsVisible(false);
      return;
    }

    // Calculate toolbar position
    if (selected !== selectedText) {
      setSelected(selectedText);

      setPosition({
        top: cursorPosition.top + window.scrollY,
        left: cursorPosition.left + window.scrollX,
      });
    }

    setIsVisible(true);
  }, [cursorPosition, isFocused, selected]);

  // Track mouse position
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

  // Track editor focus state to hide toolbar when it's not focused
  useEffect(() => {
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

  // Adjust position based on actual toolbar width after render
  useEffect(() => {
    if (!isVisible || !toolbarRef.current) return;

    const toolbar = toolbarRef.current;
    const toolbarRect = toolbar.getBoundingClientRect();
    const toolbarHalfWidth = toolbarRect.width / 2;
    const PADDING = 12;

    const viewportWidth = window.innerWidth;
    let adjustedLeft = position.left;

    // Check horizontal bounds (toolbar uses translateX(-50%))
    const leftEdge = position.left - toolbarHalfWidth;
    const rightEdge = position.left + toolbarHalfWidth;

    if (leftEdge < PADDING) {
      // Too far left
      adjustedLeft = toolbarHalfWidth + PADDING;
    } else if (rightEdge > viewportWidth - PADDING) {
      // Too far right
      adjustedLeft = viewportWidth - toolbarHalfWidth - PADDING;
    }

    // Only update if adjustment is needed
    if (adjustedLeft !== position.left) {
      setPosition({ ...position, left: adjustedLeft });
    }
  }, [isVisible, cursorPosition, selected]);

  if (!isVisible) {
    return null;
  }

  return createPortal(
    <div
      ref={toolbarRef}
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

      <Divider />

      {listBtns.map((btn) => (
        <ListBtn
          key={btn.listType}
          label={btn.label}
          listType={btn.listType}
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
