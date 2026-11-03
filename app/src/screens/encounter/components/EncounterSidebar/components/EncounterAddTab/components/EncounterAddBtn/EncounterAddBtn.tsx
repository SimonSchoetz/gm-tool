import { PlusIcon } from 'lucide-react';
import { ClickableIcon } from '@/components/ClickableIcon/ClickableIcon';
import { FCProps } from '@/types/fcProps.type';

type Props = { disabled: boolean; onAdd: () => void };

export const EncounterAddBtn: FCProps<Props> = ({ disabled, onAdd }) => (
  <ClickableIcon
    icon={<PlusIcon />}
    label='Add'
    title='Add'
    disabled={disabled}
    onClick={onAdd}
  />
);
