import {
  GlassPanel,
  SyncedInput,
  CustomScrollArea,
  TextEditor,
} from '@/components';
import { useLocation } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import './LocationHeader.css';

export const LocationHeader = () => {
  const { adventureId, locationId } = useParams({
    from: '/adventure/$adventureId/location/$locationId',
  });

  const { location, updateLocation } = useLocation(locationId, adventureId);

  if (!location) return null;

  return (
    <GlassPanel className='location-summary' intensity='bright'>
      <SyncedInput
        placeholder='Name'
        initValue={location.name ?? ''}
        onCommit={(name) => {
          updateLocation({ name });
        }}
        className='location-name-input'
        required
      />

      <CustomScrollArea>
        <TextEditor
          placeholder='Summary'
          value={location.summary ?? ''}
          textEditorId={`LOCATION_${location.id}_summary`}
          onChange={(summary) => {
            updateLocation({ summary });
          }}
        />
      </CustomScrollArea>
    </GlassPanel>
  );
};
