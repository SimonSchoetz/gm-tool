import {
  $createParagraphNode,
  $createTextNode,
  type ParagraphNode,
} from 'lexical';

// One paragraph per line; a `\r\n` or a lone `\r` is one line break, and a blank line is an empty paragraph.
export const plainTextToBlocks = (text: string): ParagraphNode[] =>
  text.split(/\r\n|\r|\n/).map((line) => {
    const paragraph = $createParagraphNode();
    if (line !== '') paragraph.append($createTextNode(line));
    return paragraph;
  });
