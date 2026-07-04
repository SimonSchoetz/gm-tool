import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useState, useEffect } from 'react';

import './FloatingToolbar.css';
import { LinkRow, TextFormattingRow } from './components';

import { EditorPopup } from '../EditorPopup';
import { getSelectionRangeRect } from '../../helper';

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
    if (!nativeSelection || nativeSelection.isCollapsed || isDragging) {
      return null;
    }
    return getSelectionRangeRect(editor);
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
