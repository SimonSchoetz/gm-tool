import { Link } from '@tanstack/react-router';
import './ToAdventureBtn.css';

import { FCProps, HtmlProps } from '@/types';

import { HoloImg } from '@/components';
import { Adventure } from '@db/adventure';
import { Routes } from '@/routes';

type Props = {
  adventure: Adventure;
} & HtmlProps<'div'>;

export const ToAdventureBtn: FCProps<Props> = ({ adventure }) => {
  const route = `/${Routes.ADVENTURE}/${adventure.id}`;

  return (
    <Link
      to={route}
      className={'to-adventure-link'}
      aria-label={adventure.name}
    >
      <HoloImg image_id={adventure.image_id!} title={adventure.name} />
    </Link>
  );
};
