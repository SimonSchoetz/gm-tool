import { FCProps } from '@/types/fcProps.type';
import { EncounterItemNotes } from '../EncounterItemNotes/EncounterItemNotes';
import { EncounterEventNameField } from './components/EncounterEventNameField/EncounterEventNameField';

type Props = { shownItemId: string };

export const EncounterShownEvent: FCProps<Props> = ({ shownItemId }) => (
  <>
    <EncounterEventNameField shownItemId={shownItemId} />
    <EncounterItemNotes
      shownItemId={shownItemId}
      placeholder='Event notes...'
    />
  </>
);
