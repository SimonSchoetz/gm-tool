import { useAdventures } from '@/data-access-layer';
import './AdventuresScreen.css';
import { ToAdventureBtn } from './components';
import { NewItemBtn, CustomScrollArea, LoadingIcon } from '@/components';
import { useRouter } from '@tanstack/react-router';
import { buildEntityPath } from '@domain';
import { ADVENTURE_PREVIEW_HEIGHT, PREVIEW_WIDTH } from '../screens.constants';

export const AdventuresScreen = () => {
  const router = useRouter();
  const { adventures, loading, createAdventure } = useAdventures();

  const handleAdventureCreation = async () => {
    const newAdventureId = await createAdventure();
    void router.navigate({
      to: buildEntityPath('adventures', newAdventureId, null),
    });
  };

  if (loading) {
    return (
      <div className='content-center'>
        <LoadingIcon />
      </div>
    );
  }

  const adventurePreviewDimensions = {
    '--adventure-preview-width': `${PREVIEW_WIDTH}px`,
    '--adventure-preview-height': `${ADVENTURE_PREVIEW_HEIGHT}px`,
  } as React.CSSProperties;

  return (
    <CustomScrollArea>
      <ul className='content-center adventure-list-container'>
        <li key='new-adventure'>
          <NewItemBtn
            className='new-adventure-btn'
            label={'Create new adventure'}
            onClick={() => {
              void handleAdventureCreation();
            }}
            style={adventurePreviewDimensions}
          />
        </li>

        {adventures.map((adventure) => (
          <li key={adventure.id}>
            <ToAdventureBtn adventure={adventure} />
          </li>
        ))}
      </ul>
    </CustomScrollArea>
  );
};
