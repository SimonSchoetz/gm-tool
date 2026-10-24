import { ReactNode } from 'react';
import { FCProps } from '@/types/fcProps.type';
import './PanelMenuBar.css';

type Props = {
  title: ReactNode;
  leading?: ReactNode;
  children?: ReactNode;
};

export const PanelMenuBar: FCProps<Props> = ({ title, leading, children }) => (
  <div className='panel-menu-bar'>
    <div className='panel-menu-bar-leading'>{leading}</div>
    <div className='clip-text panel-menu-bar-title'>{title}</div>
    <div className='panel-menu-bar-actions'>{children}</div>
  </div>
);
