import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  PASTE_COMMAND,
  $createTextNode,
  $getNearestNodeFromDOMNode,
  $getSelection,
  $isRangeSelection,
  mergeRegister,
} from 'lexical';
import { $createLinkNode, $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link';
import { openUrl } from '@tauri-apps/plugin-opener';
import { ExternalLinkIcon } from 'lucide-react';
import GlassPanel from '../../GlassPanel/GlassPanel';
import ActionContainer from '../../ActionContainer/ActionContainer';
import './EmbeddedLinkPlugin.css';

const isHttpUrl = (text: string): boolean => {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

type LinkPopup = { url: string; x: number; y: number };

export const EmbeddedLinkPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [linkPopup, setLinkPopup] = useState<LinkPopup | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        PASTE_COMMAND,
        (payload) => {
          const event = payload as ClipboardEvent;
          const text = event.clipboardData?.getData('text/plain') ?? '';
          if (!isHttpUrl(text)) return false;

          const hadSelection = editor.getEditorState().read(() => {
            const sel = $getSelection();
            return $isRangeSelection(sel) && !sel.isCollapsed();
          });

          if (hadSelection) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, text);
            return true;
          }

          editor.update(() => {
            const sel = $getSelection();
            if ($isRangeSelection(sel)) {
              const link = $createLinkNode(text);
              link.append($createTextNode(text));
              sel.insertNodes([link]);
            }
          });
          return true;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CLICK_COMMAND,
        (event) => {
          const url = editor.getEditorState().read(() => {
            const node = $getNearestNodeFromDOMNode(event.target as Node);
            if (!node) return null;
            const parent = node.getParent();
            const linkNode = $isLinkNode(node)
              ? node
              : $isLinkNode(parent)
                ? parent
                : null;
            return linkNode ? linkNode.getURL() : null;
          });
          if (url !== null) {
            setLinkPopup({ url, x: event.clientX + window.scrollX, y: event.clientY + window.scrollY });
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  useEffect(() => {
    if (!linkPopup) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setLinkPopup(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => { document.removeEventListener('mousedown', handleOutsideClick); };
  }, [linkPopup]);

  return linkPopup
    ? createPortal(
        <div
          ref={popupRef}
          className='link-popup-wrapper'
          style={{ top: linkPopup.y, left: linkPopup.x }}
        >
          <GlassPanel className='link-popup'>
            <span className='link-popup-url'>{linkPopup.url}</span>
            <ActionContainer
              label='Open in browser'
              onClick={() => {
                void openUrl(linkPopup.url);
                setLinkPopup(null);
              }}
            >
              <ExternalLinkIcon />
            </ActionContainer>
          </GlassPanel>
        </div>,
        document.body,
      )
    : null;
};
