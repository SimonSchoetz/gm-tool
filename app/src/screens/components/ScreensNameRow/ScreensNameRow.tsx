import type { EntityType } from '@domain';
import { FCProps } from '@/types/fcProps.type';
import { ScreensEntityActionsMenu } from '../ScreensEntityActionsMenu';
import './ScreensNameRow.css';

type Props = { entityType: EntityType; children: React.ReactNode };

export const ScreensNameRow: FCProps<Props> = ({ entityType, children }) => (
  <div className='screens-name-row'>
    {children}
    <ScreensEntityActionsMenu entityType={entityType} />
  </div>
);
