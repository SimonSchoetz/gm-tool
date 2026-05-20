import { GlassPanel, Input, CustomScrollArea, TextEditor } from '@/components';
import { useLocation } from '@/data-access-layer';
import { useParams } from '@tanstack/react-router';
import { useState } from 'react';
import './LocationHeader.css';

export const LocationHeader = () => {
  const { adventureId, locationId } = useParams({
    from: '/adventure/$adventureId/location/$locationId',
  });

  const { location, updateLocation } = useLocation(locationId, adventureId);

  const [locationName, setLocationName] = useState(location?.name ?? '');

  if (!location) return null;

  return (
    <GlassPanel className='location-summary' intensity='bright'>
      <Input
        placeholder='Name'
        value={locationName}
        onChange={(e) => {
          setLocationName(e.target.value);
          updateLocation({ name: e.target.value });
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
