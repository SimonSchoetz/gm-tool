import type { ReactNode } from 'react';
import { useParams } from '@tanstack/react-router';
import { Button } from '@/components/Button/Button';
import { TextEditor } from '@/components/TextEditor';
import { useEncounterLogEntries } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { getTimeString } from '@util';
import type { LogLine } from '../../../../../../helper/buildLogLines';
import './EncounterLogEntry.css';

type Props = { line: LogLine };

export const EncounterLogEntry: FCProps<Props> = ({ line }) => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { recordLogEntry, deleteLogMessage, isWriting } =
    useEncounterLogEntries(encounterId);

  let content: ReactNode;
  let actionButton: ReactNode = null;
  switch (line.kind) {
    case 'automatic':
      content = line.isReverted ? <del>{line.text}</del> : line.text;
      if (line.isRevertible) {
        actionButton = (
          <Button
            label='Revert'
            disabled={isWriting}
            onClick={() => {
              void recordLogEntry('revert', { entryId: line.id });
            }}
          />
        );
      }
      break;
    case 'message':
      content = (
        <TextEditor
          value={line.editorState}
          // Stryker disable next-line StringLiteral: the id only names the editor instance, which no test observes
          textEditorId={`log-entry-${line.id}`}
          readOnly
        />
      );
      actionButton = (
        <Button
          label='Delete'
          buttonStyle='danger'
          disabled={isWriting}
          onClick={() => {
            void deleteLogMessage(line.id);
          }}
        />
      );
      break;
    case 'unreadable':
      content = 'Unreadable entry';
      break;
  }

  return (
    // Stryker disable next-line StringLiteral: class names only; jsdom computes no style and component tests may not assert a class name
    <li className={`encounter-log-entry encounter-log-entry--${line.kind}`}>
      <div className='encounter-log-entry-content'>{content}</div>
      <div className='encounter-log-entry-buttons'>{actionButton}</div>
      <time className='encounter-log-entry-time'>
        {getTimeString(line.createdAt)}
      </time>
    </li>
  );
};
