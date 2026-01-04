import { FCProps } from '@/types';
import { Adventure } from '@db/adventure';
import { ToAdventureBtn } from '../ToAdventureBtn/ToAdventureBtn';
import { Image } from '@/components';
import './AdventureList.css';

type Props = {
  adventures: Adventure[];
};

export const AdventureList: FCProps<Props> = ({ adventures }) => {
  return (
    <>
      {adventures.map((adventure) => (
        <li key={adventure.id}>
          <ToAdventureBtn
            key={adventure.id}
            to={`/adventures/${adventure.id}`}
            label={adventure.title}
            className='adventure-preview'
          >
            {!adventure.image_id && adventure.title && (
              <p className='adventure-title'>{adventure.title}</p>
            )}
            <Image
              imageId={adventure.image_id}
              alt={`${adventure.title} preview`}
              className='adventure-img'
            />
          </ToAdventureBtn>
        </li>
      ))}
    </>
  );
};
