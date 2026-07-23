import {
  CustomScrollArea,
  GlassPanel,
  LoadingIcon,
  TextEditor,
} from '@/components';
import { useLocation } from '@/data-access-layer';
import './LocationScreen.css';
import { useParams } from '@tanstack/react-router';
import { LocationHeader, LocationSidebar } from './components';

export const LocationScreen = () => {
  const { adventureId, locationId } = useParams({
    from: '/adventure/$adventureId/location/$locationId',
  });

  const { location, updateLocation, loading } = useLocation(
    locationId,
    adventureId,
  );

  if (loading || !location) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  return (
    <GlassPanel className='location-screen'>
      <LocationSidebar />

      <CustomScrollArea>
        <div className='location-text-edit-area'>
          <LocationHeader />

          <TextEditor
            value={location.description ?? ''}
            textEditorId={`LOCATION_${location.id}_description`}
            onChange={(description) => {
              updateLocation({ description });
            }}
          />
        </div>
      </CustomScrollArea>
    </GlassPanel>
  );
};
