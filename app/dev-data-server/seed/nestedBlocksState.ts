// Node host — builds the Lexical editor state that the seed's "Nested Blocks Foe" text section holds: nested lists of all three styles, an open and a collapsed toggle, a heading and two paragraphs, then three toggles for the header cases (a header ending in bold text, a heading header, and a header saved with an extra block before its body), in the JSON shape the text editor saves.
type ListStyle = 'bullet' | 'number' | 'check';

type ItemSpec = {
  text: string;
  // Only a check list's items carry a checked state.
  checked?: boolean;
  children?: readonly ItemSpec[];
};

const LIST_TAGS: Record<ListStyle, 'ul' | 'ol'> = {
  bullet: 'ul',
  number: 'ol',
  check: 'ul',
};

const BOLD_FORMAT = 1;

const textNode = (text: string, format = 0) => ({
  detail: 0,
  format,
  mode: 'normal',
  style: '',
  text,
  type: 'text',
  version: 1,
});

const paragraphNodeOf = (children: readonly object[]) => ({
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  textStyle: '',
  type: 'paragraph',
  version: 1,
});

const paragraphNode = (text: string) => paragraphNodeOf([textNode(text)]);

// A list item at `depth` is saved with that depth as its indent, and its sub-items sit in a second item right after it, a nesting wrapper whose only child is the sub-list and whose indent is the depth of the list it stands in and which carries no checked state of its own beyond `false`. An item's `value` is its position among the real items of its list, and the wrapper after it holds the number the next real item takes.
const itemNodes = (
  style: ListStyle,
  specs: readonly ItemSpec[],
  depth: number,
) => {
  const nodes: object[] = [];
  let realItemCount = 0;
  for (const spec of specs) {
    realItemCount += 1;
    nodes.push({
      children: [textNode(spec.text)],
      ...(style === 'check' ? { checked: spec.checked ?? false } : {}),
      direction: 'ltr',
      format: '',
      indent: depth,
      type: 'listitem',
      value: realItemCount,
      version: 1,
    });
    if (spec.children) {
      nodes.push({
        children: [listNode(style, spec.children, depth + 1)],
        ...(style === 'check' ? { checked: false } : {}),
        direction: 'ltr',
        format: '',
        indent: depth,
        type: 'listitem',
        value: realItemCount + 1,
        version: 1,
      });
    }
  }
  return nodes;
};

const listNode = (
  style: ListStyle,
  specs: readonly ItemSpec[],
  depth: number,
) => ({
  children: itemNodes(style, specs, depth),
  direction: 'ltr',
  format: '',
  indent: 0,
  listType: style,
  start: 1,
  tag: LIST_TAGS[style],
  type: 'list',
  version: 1,
});

const toggleNode = (
  header: object,
  bodyParagraphs: readonly string[],
  collapsed: boolean,
  // Blocks saved between the header and the body, the damaged shape the editor repairs when it opens the text.
  extraBlocks: readonly object[] = [],
) => ({
  children: [
    header,
    ...extraBlocks,
    {
      children: bodyParagraphs.map(paragraphNode),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'toggle-body',
      version: 1,
    },
  ],
  collapsed,
  direction: 'ltr',
  format: '',
  indent: 0,
  type: 'toggle',
  version: 1,
});

const headingNode = (text: string) => ({
  children: [textNode(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  tag: 'h2',
  type: 'heading',
  version: 1,
});

// Items down to depth 2, which the alignment check of the bullet and the numbered list reads.
const nestedItems = (prefix: string): readonly ItemSpec[] => [
  {
    text: `${prefix} one`,
    children: [
      {
        text: `${prefix} one-a`,
        children: [{ text: `${prefix} one-a-i` }],
      },
      { text: `${prefix} one-b` },
    ],
  },
  { text: `${prefix} two` },
];

export const buildNestedBlocksState = (): string =>
  JSON.stringify({
    root: {
      children: [
        listNode('bullet', nestedItems('Bullet'), 0),
        listNode('number', nestedItems('Number'), 0),
        listNode(
          'check',
          [
            { text: 'Check open item' },
            {
              text: 'Check done item',
              checked: true,
              children: [
                {
                  text: 'Check nested item',
                  children: [{ text: 'Check deepest item' }],
                },
              ],
            },
          ],
          0,
        ),
        toggleNode(
          paragraphNode('Open toggle'),
          [
            'Open toggle body one',
            'Open toggle body two',
            'Open toggle body three',
          ],
          false,
        ),
        toggleNode(
          paragraphNode('Collapsed toggle'),
          ['Collapsed toggle body'],
          true,
        ),
        headingNode('Nested blocks heading'),
        paragraphNode('First closing paragraph'),
        paragraphNode('Second closing paragraph'),
        toggleNode(
          paragraphNodeOf([
            textNode('Toggle ending in '),
            textNode('bold text', BOLD_FORMAT),
          ]),
          ['Bold-ending toggle body'],
          false,
        ),
        toggleNode(
          headingNode('Heading toggle'),
          ['Heading toggle body'],
          false,
        ),
        toggleNode(
          paragraphNode('Extra block toggle'),
          ['Extra block toggle body'],
          false,
          [paragraphNode('Extra block between header and body')],
        ),
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  });
