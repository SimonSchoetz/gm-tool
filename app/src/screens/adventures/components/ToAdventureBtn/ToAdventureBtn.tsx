import { Link } from '@tanstack/react-router';
import './ToAdventureBtn.css';

import { FCProps, HtmlProps } from '@/types';

import { HoloImg } from '@/components';
import { Adventure } from '@db/adventure';
import {
  ADVENTURE_PREVIEW_WIDTH,
  ADVENTURE_PREVIEW_HEIGHT,
} from '../../../screens.constants';

type Props = {
  adventure: Adventure;
} & HtmlProps<'div'>;
export const ToAdventureBtn: FCProps<Props> = ({ adventure }) => {
  const route = `/adventure/${adventure.id}`;

  return (
    <Link
      to={route}
      className={'to-adventure-link'}
      aria-label={adventure.name}
    >
      <HoloImg
        image_id={adventure.image_id ?? null}
        title={adventure.name ?? ''}
        dimensions={{
          width: ADVENTURE_PREVIEW_WIDTH,
          height: ADVENTURE_PREVIEW_HEIGHT,
        }}
      />
    </Link>
  );
};
