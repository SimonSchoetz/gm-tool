import { Link } from '@tanstack/react-router';
import './ToAdventureBtn.css';

import { FCProps, HtmlProps } from '@/types';

import { HoloImg } from '@/components';
import { Adventure } from '@db/adventure';

type Props = {
  adventure: Adventure;
} & HtmlProps<'div'>;
/* TODO: refactor components/AdventureComponents to sub components of adventures screen */
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
        title={adventure.name}
        dimensions={{ width: 200, height: 350 }}
      />
    </Link>
  );
};
