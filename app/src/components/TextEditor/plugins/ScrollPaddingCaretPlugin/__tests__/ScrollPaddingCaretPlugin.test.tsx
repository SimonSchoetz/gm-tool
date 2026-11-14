import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import {
  LexicalComposerContext,
  createLexicalComposerContext,
} from '@lexical/react/LexicalComposerContext';
import { $createParagraphNode, $getRoot, createEditor } from 'lexical';
import { mountEditor, updateEditor } from '../../__tests__/support/mountEditor';
import { throwOnError } from '../../__tests__/support/toggleFixtures';
import { revealCaretClearOfScrollPadding } from '../helper/revealCaretClearOfScrollPadding';
import { ScrollPaddingCaretPlugin } from '../ScrollPaddingCaretPlugin';

vi.mock('../helper/revealCaretClearOfScrollPadding', () => ({
  revealCaretClearOfScrollPadding: vi.fn(),
}));

const appendParagraph = () => {
  $getRoot().append($createParagraphNode());
};

describe('ScrollPaddingCaretPlugin', () => {
  beforeEach(() => {
    vi.mocked(revealCaretClearOfScrollPadding).mockClear();
  });

  it('hands the editor and each update of it to the driver once the update has committed', () => {
    const editor = mountEditor(<ScrollPaddingCaretPlugin />);
    vi.mocked(revealCaretClearOfScrollPadding).mockClear();

    updateEditor(editor, appendParagraph);

    expect(revealCaretClearOfScrollPadding).toHaveBeenCalledTimes(1);
    const [handedEditor, update] = vi.mocked(revealCaretClearOfScrollPadding)
      .mock.calls[0];
    expect(handedEditor).toBe(editor);
    expect(update.dirtyElements.size).toBeGreaterThan(0);
  });

  it('registers on the new editor when the composer hands it another one', () => {
    const composerContext = createLexicalComposerContext(null, null);
    const first = createEditor({ onError: throwOnError });
    const second = createEditor({ onError: throwOnError });
    const plugin = (editor: typeof first) => (
      <LexicalComposerContext.Provider value={[editor, composerContext]}>
        <ScrollPaddingCaretPlugin />
      </LexicalComposerContext.Provider>
    );
    const { rerender } = render(plugin(first));
    rerender(plugin(second));
    vi.mocked(revealCaretClearOfScrollPadding).mockClear();

    second.update(appendParagraph, { discrete: true });
    first.update(appendParagraph, { discrete: true });

    expect(revealCaretClearOfScrollPadding).toHaveBeenCalledTimes(1);
    expect(vi.mocked(revealCaretClearOfScrollPadding).mock.calls[0][0]).toBe(
      second,
    );
  });

  it('stops handing updates to the driver once the editor has unmounted', () => {
    const editor = mountEditor(<ScrollPaddingCaretPlugin />);
    cleanup();
    vi.mocked(revealCaretClearOfScrollPadding).mockClear();

    editor.update(appendParagraph, { discrete: true });

    expect(revealCaretClearOfScrollPadding).not.toHaveBeenCalled();
  });
});
