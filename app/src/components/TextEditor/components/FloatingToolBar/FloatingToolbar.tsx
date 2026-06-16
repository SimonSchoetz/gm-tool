import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useRef, useState, useEffect } from 'react';
import { SELECTION_CHANGE_COMMAND, COMMAND_PRIORITY_LOW } from 'lexical';
import './FloatingToolbar.css';
import {
  TextFormatBtn,
  HeadingBtn,
  ListBtn,
  LinkBtn,
  LinkInput,
  Divider,
} from './components';
import { textFormatBtns, headingBtns, listBtns } from './toolbarConfig';
import { EditorPopup } from '../EditorPopup/EditorPopup';

export const FloatingToolbar = () => {
  const [editor] = useLexicalComposerContext();
  const [isOpen, setIsOpen] = useState(false);
  const selectionRangeRef = useRef<Range | null>(null);
  const isMouseDownRef = useRef(false);

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

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const updateToolbarVisibility = () => {
      if (isLinkInputModeRef.current) return;
      const nativeSelection = window.getSelection();
      if (
        nativeSelection &&
        nativeSelection.rangeCount > 0 &&
        !nativeSelection.isCollapsed
      ) {
        selectionRangeRef.current = nativeSelection.getRangeAt(0);
        setIsOpen(true);
      } else {
        selectionRangeRef.current = null;
        setIsOpen(false);
      }
    };

    const handleMouseDown = () => {
      isMouseDownRef.current = true;
    };
    const handleMouseUp = () => {
      isMouseDownRef.current = false;
      updateToolbarVisibility();
    };
    const handleBlur = () => {
      if (isLinkInputModeRef.current) return;
      setIsOpen(false);
    };

    rootElement.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    rootElement.addEventListener('blur', handleBlur);

    const unregisterSelectionChange = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        if (isMouseDownRef.current) return false;
        updateToolbarVisibility();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    );

    return () => {
      rootElement.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      rootElement.removeEventListener('blur', handleBlur);
      unregisterSelectionChange();
    };
  }, [editor]);

  if (!isOpen) return null;

  return (
    <EditorPopup
      getAnchorRect={() =>
        selectionRangeRef.current?.getBoundingClientRect() ?? null
      }
    >
      <div
        className='floating-toolbar'
        onMouseDown={
          isLinkInputMode
            ? undefined
            : (e) => {
                e.preventDefault();
              }
        }
      >
        {isLinkInputMode ? (
          <LinkInput onClose={exitLinkInputMode} />
        ) : (
          <>
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
            <Divider />
            <LinkBtn onRequestLinkInput={enterLinkInputMode} />
          </>
        )}
      </div>
    </EditorPopup>
  );
};
