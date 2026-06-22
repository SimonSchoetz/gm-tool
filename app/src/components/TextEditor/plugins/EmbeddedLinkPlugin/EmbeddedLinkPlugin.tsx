import { useEffect, useRef, useState } from 'react';
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
import {
  $createLinkNode,
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from '@lexical/link';
import { openUrl } from '@tauri-apps/plugin-opener';
import { ExternalLinkIcon } from 'lucide-react';
import { GlassPanel } from '../../../GlassPanel/GlassPanel';
import { ClickableIcon } from '../../../ClickableIcon/ClickableIcon';
import { EditorPopup } from '../../components/EditorPopup';

import './EmbeddedLinkPlugin.css';

const isHttpUrl = (text: string): boolean => {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export const EmbeddedLinkPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const linkElementRef = useRef<Element | null>(null);

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
          const node = $getNearestNodeFromDOMNode(event.target as Node);
          if (!node) return false;
          const parent = node.getParent();
          const linkNode = $isLinkNode(node)
            ? node
            : $isLinkNode(parent)
              ? parent
              : null;
          const url = linkNode ? linkNode.getURL() : null;
          if (url !== null) {
            linkElementRef.current = (event.target as Element).closest('a');
            setLinkUrl(url);
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  if (linkUrl === null) return null;

  return (
    <EditorPopup
      getAnchorRect={() =>
        linkElementRef.current?.getBoundingClientRect() ?? null
      }
      onClickOutside={() => {
        setLinkUrl(null);
      }}
    >
      <GlassPanel className='link-popup'>
        <span className='link-popup-url'>{linkUrl}</span>
        <ClickableIcon
          icon={<ExternalLinkIcon />}
          label='Open in browser'
          onClick={() => {
            void openUrl(linkUrl);
            setLinkUrl(null);
          }}
        />
      </GlassPanel>
    </EditorPopup>
  );
};
