import { $createListItemNode } from '@lexical/list';
import type { ListItemNode } from '@lexical/list';
import type { ParagraphNode } from 'lexical';

// Rebuilds a paragraph as a list item, taking over the paragraph's children so its text and inline formatting stay. The item is not yet in the document, and the emptied paragraph is left where it is for the caller to remove; the list the item is put in decides its check state.
export const convertToListItem = (paragraph: ParagraphNode): ListItemNode => {
  const item = $createListItemNode();
  item.append(...paragraph.getChildren());
  return item;
};
