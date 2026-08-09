import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TableCellNode } from '@lexical/table';

// Lexical's TableCellNode.exportDOM bakes a hardcoded '#f2f3f5' inline background-color onto header cells for portability to non-Lexical clipboard targets, and its importDOM reads that same inline style back into __backgroundColor on paste — round-tripping a copy/paste between two editors permanently overrides editor-table-header's CSS background. This app has no UI to set a cell background intentionally, so any non-null backgroundColor can only have arrived via that round-trip.
export const TableCellBackgroundGuardPlugin = (): null => {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerNodeTransform(TableCellNode, (cellNode) => {
      if (cellNode.getBackgroundColor() !== null) {
        cellNode.setBackgroundColor(null);
      }
    });
  }, [editor]);

  return null;
};
