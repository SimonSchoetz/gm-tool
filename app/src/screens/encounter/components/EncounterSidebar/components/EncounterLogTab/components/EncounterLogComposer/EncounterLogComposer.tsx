import { useParams } from '@tanstack/react-router';
import { TextEditor } from '@/components/TextEditor';
import { useEncounterLogEntries } from '@/data-access-layer';
import './EncounterLogComposer.css';

export const EncounterLogComposer = () => {
  const { encounterId } = useParams({
    from: '/adventure/$adventureId/encounter/$encounterId',
  });
  const { recordLogEntry } = useEncounterLogEntries(encounterId);

  const onSubmit = (editorState: string) =>
    recordLogEntry('message', { editorState });

  return (
    <div className='encounter-log-composer'>
      <TextEditor
        variant='message'
        textEditorId={`encounter-log-composer-${encounterId}`}
        value=''
        placeholder='Write a message...'
        onSubmit={onSubmit}
      />
    </div>
  );
};
