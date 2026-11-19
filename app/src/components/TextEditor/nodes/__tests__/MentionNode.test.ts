import { describe, expect, it } from 'vitest';
import { $createParagraphNode, $getRoot, createEditor } from 'lexical';
import type { SerializedElementNode, SerializedLexicalNode } from 'lexical';
import { MentionNode } from '../MentionNode';

const throwOnError = (error: Error) => {
  throw error;
};

// The serialized form of the mentions built by `build`, as the editor state stored in the database holds them.
const serializedMentions = (
  build: () => MentionNode[],
): SerializedLexicalNode[] => {
  const editor = createEditor({ nodes: [MentionNode], onError: throwOnError });
  editor.update(
    () => {
      const paragraph = $createParagraphNode();
      paragraph.append(...build());
      $getRoot().append(paragraph);
    },
    { discrete: true },
  );
  const [paragraph] = editor.getEditorState().toJSON().root
    .children as SerializedElementNode[];
  return paragraph.children;
};

describe('MentionNode', () => {
  it('serializes a mention with its type, version, entity and display name, and its adventure and formats only where it has them', () => {
    const mentions = serializedMentions(() => [
      new MentionNode('npc-1', 'npc', 'Mara', 'adventure-1', ['bold']),
      new MentionNode('session-1', 'session', 'Session 1'),
    ]);

    expect(mentions).toEqual([
      {
        type: 'mention',
        version: 1,
        entityId: 'npc-1',
        entityType: 'npc',
        displayName: 'Mara',
        adventureId: 'adventure-1',
        mentionFormats: ['bold'],
      },
      {
        type: 'mention',
        version: 1,
        entityId: 'session-1',
        entityType: 'session',
        displayName: 'Session 1',
      },
    ]);
  });
});
