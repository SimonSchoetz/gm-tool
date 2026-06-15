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
import { TextFormatBtn, HeadingBtn, ListBtn, LinkBtn, LinkInput, Divider } from './components';
import { textFormatBtns, headingBtns, listBtns } from './toolbarConfig';

type Position = {
  top: number;
  left: number;
};

const initPosition: Position = { top: 0, left: 0 };

export const FloatingToolbar = () => {
  const [editor] = useLexicalComposerContext();
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState(initPosition);
  const [cursorPosition, setCursorPosition] = useState(initPosition);
  const [selected, setSelected] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [isLinkInputMode, setIsLinkInputMode] = useState(false);
  const isLinkInputModeRef = useRef(false);

  const enterLinkInputMode = () => {
    isLinkInputModeRef.current = true;
    setIsLinkInputMode(true);
  };

  const exitLinkInputMode = () => {
    isLinkInputModeRef.current = false;
    setIsLinkInputMode(false);
  };

  const updateToolbar = useCallback(() => {
    if (isLinkInputModeRef.current) return;

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
    const rootElement = editor.getRootElement();

    const handleFocus = () => {
      setIsFocused(true);
    };
    const handleBlur = () => {
      if (isLinkInputModeRef.current) return;
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

  useEffect(() => {
    if (!isVisible || !toolbarRef.current) return;

    const toolbar = toolbarRef.current;
    const toolbarRect = toolbar.getBoundingClientRect();
    const toolbarHalfWidth = toolbarRect.width / 2;
    const PADDING = 12;
    const viewportWidth = window.innerWidth;

    setPosition((currentPosition) => {
      // Check horizontal bounds (toolbar uses translateX(-50%))
      const leftEdge = currentPosition.left - toolbarHalfWidth;
      const rightEdge = currentPosition.left + toolbarHalfWidth;

      let adjustedLeft = currentPosition.left;
      if (leftEdge < PADDING) {
        adjustedLeft = toolbarHalfWidth + PADDING;
      } else if (rightEdge > viewportWidth - PADDING) {
        adjustedLeft = viewportWidth - toolbarHalfWidth - PADDING;
      }

      if (adjustedLeft === currentPosition.left) return currentPosition;
      return { ...currentPosition, left: adjustedLeft };
    });
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
      onMouseDown={isLinkInputMode ? undefined : (e) => { e.preventDefault(); }}
    >
      {isLinkInputMode ? (
        <LinkInput onClose={exitLinkInputMode} />
      ) : (
        <>
          {headingBtns.map((btn) => (
            <HeadingBtn key={btn.headingType} label={btn.label} headingType={btn.headingType} icon={btn.icon} />
          ))}
          <Divider />
          {textFormatBtns.map((btn) => (
            <TextFormatBtn key={btn.formatType} label={btn.label} formatType={btn.formatType} icon={btn.icon} />
          ))}
          <Divider />
          {listBtns.map((btn) => (
            <ListBtn key={btn.listType} label={btn.label} listType={btn.listType} icon={btn.icon} />
          ))}
          <Divider />
          <LinkBtn onRequestLinkInput={enterLinkInputMode} />
        </>
      )}
    </div>,
    document.body,
  );
};
