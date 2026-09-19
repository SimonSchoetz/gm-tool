import { Link } from '@tanstack/react-router';
import './ToAdventureBtn.css';

import { FCProps } from '@/types';

import { HoloImg } from '@/components';
import { Adventure } from '@db/adventure';
import { buildEntityPath } from '@domain';
import {
  PREVIEW_WIDTH,
  ADVENTURE_PREVIEW_HEIGHT,
} from '../../../screens.constants';

type Props = {
  adventure: Adventure;
};
export const ToAdventureBtn: FCProps<Props> = ({ adventure }) => {
  const route = buildEntityPath('adventures', adventure.id, null);

  return (
    <Link
      to={route}
      className={'to-adventure-link'}
      aria-label={adventure.name ?? undefined}
    >
      <HoloImg
        image_id={adventure.image_id}
        title={adventure.name ?? ''}
        dimensions={{
          width: PREVIEW_WIDTH,
          height: ADVENTURE_PREVIEW_HEIGHT,
        }}
      />
    </Link>
  );
};
