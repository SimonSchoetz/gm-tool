import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNearestNodeFromDOMNode } from 'lexical';
import { $isListItemNode } from '@lexical/list';

/**
 * Makes checklist checkboxes interactive even when the editor is non-editable (readOnly).
 *
 * Lexical's built-in CheckListPlugin guards all checkbox clicks behind editor.isEditable(),
 * so checkboxes are inert in read-only mode. This plugin adds a separate click listener that
 * bypasses that guard and calls ListItemNode.toggleChecked() directly via editor.update().
 *
 * Detection strategy: Lexical sets `__lexicalListType = 'check'` on the parent UL/OL DOM node
 * of any checklist. If the clicked LI's parent has that internal field, and the click is within
 * the ::before area (the visual checkbox), we intercept and toggle the node.
 */
export const CheckboxReadOnlyPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement) || target.tagName !== 'LI') return;

      const parentNode = target.parentNode;
      if (
        !parentNode ||
        (parentNode as unknown as { __lexicalListType?: string })
          .__lexicalListType !== 'check'
      )
        return;

      const rect = target.getBoundingClientRect();
      const beforeStyles = window.getComputedStyle(target, '::before');
      const beforeWidth = parseFloat(beforeStyles.width) || 24;
      const clickX = event.clientX;

      const isInCheckboxArea =
        target.dir === 'rtl'
          ? clickX < rect.right && clickX > rect.right - beforeWidth
          : clickX > rect.left && clickX < rect.left + beforeWidth;

      if (isInCheckboxArea) {
        event.preventDefault();
        editor.update(() => {
          const node = $getNearestNodeFromDOMNode(target);
          if ($isListItemNode(node)) {
            node.toggleChecked();
          }
        });
      }
    };

    rootElement.addEventListener('click', handleClick);
    return () => {
      rootElement.removeEventListener('click', handleClick);
    };
  }, [editor]);

  return null;
};
