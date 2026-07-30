import { LoadingIcon, TextEditor } from '@/components';
import { useLocation } from '@/data-access-layer';
import { useParams, useRouterState } from '@tanstack/react-router';
import { LocationSidebar } from './components';
import {
  ScreensNameInput,
  ScreensTextEditorLayout,
  ScreensSummary,
} from '../components';

export const LocationScreen = () => {
  const { adventureId, locationId } = useParams({
    from: '/adventure/$adventureId/location/$locationId',
  });

  const focusNameInput = useRouterState({
    select: (state) => state.location.state.focusNameInput ?? false,
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
    <ScreensTextEditorLayout
      sideBar={<LocationSidebar />}
      header={
        <ScreensSummary>
          <TextEditor
            placeholder='Location Summary'
            value={location.summary ?? ''}
            textEditorId={`LOCATION_${location.id}_summary`}
            onChange={(summary) => {
              updateLocation({ summary });
            }}
          />
        </ScreensSummary>
      }
      body={
        <>
          <ScreensNameInput
            autoFocus={focusNameInput}
            placeholder='Location Name'
            initValue={location.name ?? ''}
            onCommit={(name) => {
              updateLocation({ name });
            }}
          />
          <TextEditor
            value={location.description ?? ''}
            textEditorId={`LOCATION_${location.id}_description`}
            onChange={(description) => {
              updateLocation({ description });
            }}
          />
        </>
      }
    />
  );
};
