import { useTableConfigs } from '@/data-access-layer';
import { FCProps } from '@/types/fcProps.type';
import { ScreenNavBtn } from '../ScreenNavBtn/ScreenNavBtn';
import { getTableColor } from './helper/getTableColor';

type Props = {
  label: string;
  to: React.ComponentProps<typeof ScreenNavBtn>['to'];
  tableName: string;
  isDisabled: boolean;
};

export const TableNavItem: FCProps<Props> = ({
  label,
  to,
  tableName,
  isDisabled,
}) => {
  const { tableConfigs } = useTableConfigs();

  const configColor = getTableColor(tableConfigs, tableName);

  return (
    <ScreenNavBtn
      label={label}
      to={to}
      isDisabled={isDisabled}
      configColor={configColor}
    />
  );
};
