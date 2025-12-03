import { FCProps } from '@/types';
import { Adventure } from '@db/adventure';
import AdventureBtn from '../AdventureBtn/AdventureBtn';
import { Image } from '@/components';

type Props = {
  adventures: Adventure[];
};

export const AdventureList: FCProps<Props> = ({ adventures }) => {
  return (
    <>
      {adventures.map((adventure) => (
        <li key={adventure.id}>
          <AdventureBtn
            key={adventure.id}
            onClick={() => console.log('Navigate to /adventure.id')}
            label={adventure.title}
          >
            <p>{adventure.title}</p>
            <Image
              imageId={adventure.image_id}
              alt={`${adventure.title} preview`}
            />
          </AdventureBtn>
        </li>
      ))}
    </>
  );
};
