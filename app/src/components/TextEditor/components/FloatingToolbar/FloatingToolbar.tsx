import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useRef, useState, useEffect } from 'react';

import './FloatingToolbar.css';
import { LinkRow, TextFormattingRow } from './components';

import { EditorPopup } from '../EditorPopup';
import { getSelectionLinkUrl } from './helper';

export const FloatingToolbar = () => {
  const [editor] = useLexicalComposerContext();
  const selectionRangeRef = useRef<Range | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const updateToolbarPosition = () => {
      // if (!isLinkEditingRef.current) {
      //   const existingUrl = editor.getEditorState().read(getSelectionLinkUrl);
      //   const hasLink = existingUrl !== null;
      //   setLinkInputEnabled(hasLink);
      //   setLinkUrl(existingUrl ?? '');
      //   setLinkInitialUrl(existingUrl ?? '');
      // }
    };

    const handleMouseDown = () => {
      selectionRangeRef.current = null;
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

  return (
    <EditorPopup
      getAnchorRect={() => {
        const nativeSelection = window.getSelection();
        if (
          nativeSelection &&
          nativeSelection.rangeCount > 0 &&
          !nativeSelection.isCollapsed &&
          !isDragging
        ) {
          return nativeSelection.getRangeAt(0).getBoundingClientRect();
        } else {
          return null;
        }
      }}
      onClickOutside={() => {
        console.log('clicked outside');

        // isLinkEditingRef.current = false;
        // setLinkInputEnabled(false);
        // setLinkUrl('');
        // setLinkInitialUrl('');
      }}
    >
      <div className='floating-toolbar'>
        <TextFormattingRow />

        {/*<LinkRow />*/}
      </div>
    </EditorPopup>
  );
};
