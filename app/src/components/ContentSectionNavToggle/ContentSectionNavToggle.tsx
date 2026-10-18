import { MenuIcon } from 'lucide-react';
import { FCProps } from '@/types/fcProps.type';
import { ClickableIcon } from '../ClickableIcon/ClickableIcon';

type Props = {
  isOpen: boolean;
  onToggle: () => void;
};

export const ContentSectionNavToggle: FCProps<Props> = ({
  isOpen,
  onToggle,
}) => (
  <ClickableIcon
    icon={<MenuIcon />}
    isActive={isOpen}
    onClick={onToggle}
    label='Toggle content sections'
    title='Content sections'
  />
);
