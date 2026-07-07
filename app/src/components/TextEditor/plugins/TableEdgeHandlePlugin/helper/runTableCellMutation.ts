import { LexicalEditor } from 'lexical';
import { getTableObserverFromTableElement } from '@lexical/table';

export const runTableCellMutation = (
  editor: LexicalEditor,
  cellX: number,
  cellY: number,
  tableElement: HTMLTableElement,
  mutate: () => void,
): void => {
  editor.update(() => {
    const observer = getTableObserverFromTableElement(tableElement);
    if (!observer) return;
    const { tableNode } = observer.$lookup();
    const table = observer.getTable();
    const cellNode = tableNode.getCellNodeFromCords(cellX, cellY, table);
    if (!cellNode) return;
    cellNode.selectStart();
    mutate();
  });
};
