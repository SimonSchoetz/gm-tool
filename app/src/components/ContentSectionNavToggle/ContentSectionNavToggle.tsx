import type { Ref } from 'react';
import { MenuIcon } from 'lucide-react';
import { FCProps } from '@/types/fcProps.type';
import { ClickableIcon } from '../ClickableIcon/ClickableIcon';

type Props = {
  isOpen: boolean;
  onToggle: () => void;
  ref: Ref<HTMLButtonElement>;
};

export const ContentSectionNavToggle: FCProps<Props> = ({
  isOpen,
  onToggle,
  ref,
}) => (
  <ClickableIcon
    ref={ref}
    icon={<MenuIcon />}
    isActive={isOpen}
    onClick={onToggle}
    label='Toggle content sections'
    title='Content sections'
  />
);
