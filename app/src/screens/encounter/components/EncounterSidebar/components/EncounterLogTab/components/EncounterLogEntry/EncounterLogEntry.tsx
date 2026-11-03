import type { ReactNode } from 'react';
import { useParams } from '@tanstack/react-router';
import { Trash2Icon, Undo2Icon } from 'lucide-react';
import { ClickableIcon } from '@/components/ClickableIcon/ClickableIcon';
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
    case 'automatic': {
      const parts = line.parts.map((part, index) =>
        part.kind === 'name' ? (
          <span
            // The parts of a line are fixed once it is built and never reordered, so the position is a stable key.
            key={index}
            className='encounter-log-entry-name clip-text'
            title={part.text}
          >
            {part.text}
          </span>
        ) : (
          part.text
        ),
      );
      content = line.isReverted ? <del>{parts}</del> : parts;
      if (line.isRevertible) {
        actionButton = (
          <ClickableIcon
            icon={<Undo2Icon />}
            label='Revert'
            title='Revert'
            disabled={isWriting}
            onClick={() => {
              void recordLogEntry('revert', { entryId: line.id });
            }}
          />
        );
      }
      break;
    }
    case 'message':
      content = (
        <TextEditor
          value={line.editorState}
          textEditorId={`log-entry-${line.id}`}
          readOnly
        />
      );
      actionButton = (
        <ClickableIcon
          icon={<Trash2Icon />}
          variant='danger'
          label='Delete'
          title='Delete'
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
    <li className={`encounter-log-entry encounter-log-entry--${line.kind}`}>
      <div className='encounter-log-entry-content'>{content}</div>
      <div className='encounter-log-entry-buttons'>{actionButton}</div>
      <time className='encounter-log-entry-time'>
        {getTimeString(line.createdAt)}
      </time>
    </li>
  );
};
