import type { EntityType } from '@domain';
import { FCProps } from '@/types/fcProps.type';
import { ScreensEntityActionsMenu } from '../ScreensEntityActionsMenu';
import './ScreensNameRow.css';

type Props = {
  entityType: EntityType;
  hideActionsMenu?: boolean;
  children: React.ReactNode;
};

export const ScreensNameRow: FCProps<Props> = ({
  entityType,
  hideActionsMenu,
  children,
}) => (
  <div className='screens-name-row'>
    {children}
    {!hideActionsMenu && <ScreensEntityActionsMenu entityType={entityType} />}
  </div>
);
