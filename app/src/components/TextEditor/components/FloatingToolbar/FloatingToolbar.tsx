import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useState, useEffect } from 'react';

import './FloatingToolbar.css';
import { LinkRow, TextFormattingRow } from './components';

import { EditorPopup } from '../EditorPopup';

export const FloatingToolbar = () => {
  const [editor] = useLexicalComposerContext();
  const [isDragging, setIsDragging] = useState(false);

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
    const rootElement = editor.getRootElement();
    if (
      nativeSelection &&
      nativeSelection.rangeCount > 0 &&
      !nativeSelection.isCollapsed &&
      !isDragging &&
      rootElement?.contains(nativeSelection.anchorNode)
    ) {
      return nativeSelection.getRangeAt(0).getBoundingClientRect();
    }
    return null;
  };

  return (
    <EditorPopup getAnchorRect={getAnchorRect}>
      <div className='floating-toolbar'>
        <TextFormattingRow />

        <LinkRow />
      </div>
    </EditorPopup>
  );
};
