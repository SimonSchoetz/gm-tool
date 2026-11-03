import type { ReactNode } from 'react';
import { FCProps } from '@/types/fcProps.type';
import './EntitySectionHeaderLeading.css';

type Props = {
  controls?: ReactNode;
  sectionName?: string;
};

export const EntitySectionHeaderLeading: FCProps<Props> = ({
  controls = null,
  sectionName,
}) => (
  <span className='entity-section-header-leading'>
    {controls !== null && <>{controls}</>}
    {sectionName !== undefined && (
      <span className='label entity-section-header-leading-label'>
        {sectionName}
      </span>
    )}
  </span>
);
