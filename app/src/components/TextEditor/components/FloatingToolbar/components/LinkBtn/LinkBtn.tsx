import { FCProps } from '@/types';
import { LinkIcon } from 'lucide-react';
import { BaseBtn } from '../BaseBtn/BaseBtn';
import './LinkBtn.css';

type Props = {
  isActive: boolean;
  onClick: () => void;
};

export const LinkBtn: FCProps<Props> = ({ isActive, onClick }) => (
  <BaseBtn label='Link' icon={LinkIcon} isActive={isActive} onClick={onClick} />
);
