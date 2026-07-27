import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getNearestNodeFromDOMNode } from 'lexical';
import { $isToggleNode } from '../../nodes';
import { TOGGLE_GUTTER_CLASS } from '../../TextEditor.constants';

export const ToggleGutterPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const rootElement = editor.getRootElement();
    if (!rootElement) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const gutter = target.closest(`.${TOGGLE_GUTTER_CLASS}`);
      if (!gutter) return;

      const toggleRoot = gutter.parentElement;
      if (!toggleRoot) return;

      event.preventDefault();
      editor.update(() => {
        const node = $getNearestNodeFromDOMNode(toggleRoot);
        if ($isToggleNode(node)) {
          node.toggleCollapsed();
        }
      });
    };

    rootElement.addEventListener('click', handleClick);
    return () => {
      rootElement.removeEventListener('click', handleClick);
    };
  }, [editor]);

  return null;
};
