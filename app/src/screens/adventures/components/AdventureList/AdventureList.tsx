import { FCProps } from '@/types';
import { Adventure } from '@db/adventure';
import AdventureBtn from '../AdventureBtn/AdventureBtn';

type Props = {
  adventures: Adventure[];
};

export const AdventureList: FCProps<Props> = ({ adventures }) => {
  return (
    <div>
      {adventures.map((adventure) => (
        <AdventureBtn
          key={adventure.id}
          onClick={() => console.log('Navigate to /adventure.id')}
          label={adventure.title}
        >
          {/* <img src={adventure?.imgFilePath} alt='Adventure preview' /> */}
          <p>{adventure.title}</p>
        </AdventureBtn>
      ))}
    </div>
  );
};
