import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useState, useEffect, useRef } from 'react';

import './FloatingToolbar.css';
import { LinkRow, TextFormattingRow } from './components';

import { EditorPopup } from '../EditorPopup';
import { getSelectionRangeRect } from '../../helper';

export const FloatingToolbar = () => {
  const [editor] = useLexicalComposerContext();
  const [isDragging, setIsDragging] = useState(false);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const lastRectRef = useRef<DOMRect | null>(null);

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleMouseDown = () => {
      setIsDragging(true);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    rootElement.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      rootElement.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editor]);

  const getAnchorRect = () => {
    const nativeSelection = window.getSelection();
    if (nativeSelection && !nativeSelection.isCollapsed && !isDragging) {
      const rect = getSelectionRangeRect(editor);
      if (rect) {
        lastRectRef.current = rect;
        return rect;
      }
    }

    // Focusing the toolbar's own controls (e.g. the link URL input) collapses window.getSelection() as an unavoidable side effect — that isn't the user dismissing the toolbar, so keep it anchored at its last known position instead of closing.
    const isFocusInsideToolbar =
      toolbarRef.current !== null &&
      document.activeElement !== null &&
      toolbarRef.current.contains(document.activeElement);
    return isFocusInsideToolbar ? lastRectRef.current : null;
  };

  return (
    <EditorPopup getAnchorRect={getAnchorRect}>
      <div className='floating-toolbar' ref={toolbarRef}>
        <TextFormattingRow />

        <LinkRow />
      </div>
    </EditorPopup>
  );
};
