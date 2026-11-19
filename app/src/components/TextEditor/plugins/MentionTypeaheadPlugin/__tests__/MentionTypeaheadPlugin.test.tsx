import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import {
  $createParagraphNode,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  KEY_ENTER_COMMAND,
  type LexicalEditor,
} from 'lexical';
import { $isMentionNode, MentionNode } from '../../../nodes/MentionNode';
import { EditorHandle } from '../../__tests__/support/EditorHandle';
import { MentionTypeaheadPlugin } from '../MentionTypeaheadPlugin';

const SEED_ENCOUNTER = vi.hoisted(() => ({
  id: 'seed-encounter',
  name: 'Seed Encounter',
  tableName: 'encounters',
  color: '254, 157, 93',
  adventureId: 'seed-adventure',
  updatedAt: '2026-11-14T00:00:00.000Z',
}));

vi.mock('@tanstack/react-router', () => ({
  useParams: () => ({ adventureId: SEED_ENCOUNTER.adventureId }),
}));

vi.mock('@/data-access-layer', () => ({
  useTableConfigs: () => ({ tableConfigs: [] }),
}));

vi.mock('@services/mentionSearchService', () => ({
  searchMentions: () => Promise.resolve([SEED_ENCOUNTER]),
}));

// The badge reads entity data and the router, which this test of the typeahead has no use for.
vi.mock('../../../components/MentionBadge', () => ({
  MentionBadge: ({ displayName }: { displayName: string }) => (
    <span>{displayName}</span>
  ),
}));

// The menu places itself at the caret's range, watches its own size and scrolls its selected option into view; jsdom computes no layout and has none of these APIs.
beforeEach(() => {
  Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => new DOMRect(),
  });
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: vi.fn(),
  });
  vi.stubGlobal(
    'ResizeObserver',
    vi.fn(function () {
      return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
    }),
  );
});

afterEach(() => {
  Reflect.deleteProperty(Range.prototype, 'getBoundingClientRect');
  Reflect.deleteProperty(Element.prototype, 'scrollIntoView');
  vi.unstubAllGlobals();
});

const mount = (): LexicalEditor => {
  let editor: LexicalEditor | null = null;
  render(
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the same LexicalComposer TextEditor mounts, whose initialConfig the plugin runs under
    <LexicalComposer
      initialConfig={{
        namespace: 'mention-typeahead-test',
        nodes: [MentionNode],
        onError: (error: Error) => {
          throw error;
        },
      }}
    >
      <RichTextPlugin
        contentEditable={<ContentEditable />}
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <MentionTypeaheadPlugin />
      <EditorHandle
        onEditor={(mounted) => {
          editor = mounted;
        }}
      />
    </LexicalComposer>,
  );
  const mountedEditor = editor as LexicalEditor | null;
  if (mountedEditor === null) {
    throw new Error('The editor handle did not report the editor');
  }
  return mountedEditor;
};

// React re-renders only once the interaction returns, so everything it does reaches the menu React last rendered. The plugin commits a picked mention in a non-discrete update, which Lexical flushes on a microtask; awaiting one inside act lands that commit before the assertions.
const interact = (interaction: () => void) =>
  act(async () => {
    interaction();
    await Promise.resolve();
  });

// The search resolves on a microtask, and Lexical's menu registers the Return handler for the options it renders in an effect. Typing inside an async act lets act render the options and run that effect before Return is pressed; outside act, React runs the effect in a later task, and a Return that arrives first reaches the handler for the empty option list, which passes it on to the rich-text plugin as a new paragraph.
const typeQuery = async (editor: LexicalEditor, query: string) => {
  await interact(() => {
    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(query));
        $getRoot().clear().append(paragraph);
        paragraph.selectEnd();
      },
      { discrete: true },
    );
  });
  screen.getByRole('option', {
    name: new RegExp(SEED_ENCOUNTER.name),
    selected: true,
  });
};

const pressEnter = (editor: LexicalEditor) =>
  editor.dispatchCommand(
    KEY_ENTER_COMMAND,
    new KeyboardEvent('keydown', { key: 'Enter' }),
  );

const readMentionIds = (editor: LexicalEditor) =>
  editor.getEditorState().read(() =>
    $getRoot()
      .getChildren()
      .flatMap((block) => ($isElementNode(block) ? block.getChildren() : []))
      .filter($isMentionNode)
      .map((mention) => mention.__entityId),
  );

const readCaretNextToMention = (editor: LexicalEditor) =>
  editor.getEditorState().read(() => {
    const selection = $getSelection();
    if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false;
    const anchor = selection.anchor;
    const anchorNode = anchor.getNode();
    if (!$isElementNode(anchorNode)) return false;
    return $isMentionNode(anchorNode.getChildAtIndex(anchor.offset - 1));
  });

describe('MentionTypeaheadPlugin', () => {
  it('replaces the typed query with the picked mention and puts the caret after it', async () => {
    const editor = mount();
    await typeQuery(editor, '@Seed');

    await interact(() => {
      pressEnter(editor);
    });

    expect(readMentionIds(editor)).toEqual([SEED_ENCOUNTER.id]);
    expect(
      editor.getEditorState().read(() => $getRoot().getTextContent()),
    ).toBe(`@${SEED_ENCOUNTER.name}`);
    expect(readCaretNextToMention(editor)).toBe(true);
  });

  // Lexical opens the menu in a React transition and closes it through React state, so a Return that arrives after the query text left the caret but before React re-rendered still reaches the open menu, whose split of the query node then finds nothing to replace.
  it('inserts the picked mention at the caret when the query text is gone by the time Return reaches the menu', async () => {
    const editor = mount();
    await typeQuery(editor, '@Seed');

    await interact(() => {
      editor.update(
        () => {
          const paragraph = $createParagraphNode();
          $getRoot().clear().append(paragraph);
          paragraph.select();
        },
        { discrete: true },
      );
      pressEnter(editor);
    });

    expect(readMentionIds(editor)).toEqual([SEED_ENCOUNTER.id]);
    expect(readCaretNextToMention(editor)).toBe(true);
  });
});
