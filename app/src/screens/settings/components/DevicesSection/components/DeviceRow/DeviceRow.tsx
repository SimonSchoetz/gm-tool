import { Trash2 as Trash2Icon } from 'lucide-react';
import type { PairedDevice } from '@db/paired-device';
import { ClickableIcon } from '@/components';
import { usePairedDevices } from '@/data-access-layer';
import { useDeleteDialog } from '@/providers';
import type { FCProps } from '@/types';
import { StatusDot } from './components';
import './DeviceRow.css';

type Props = {
  device: PairedDevice;
  connected: boolean;
};

export const DeviceRow: FCProps<Props> = ({ device, connected }) => {
  const { forgetDevice } = usePairedDevices();
  const { openDeleteDialog } = useDeleteDialog();

  // `||` (not `??`): a cleared name is an empty string and also falls back to the id prefix.
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const displayName = device.name || device.id.slice(0, 8);

  return (
    <li className='device-row'>
      <StatusDot connected={connected} />
      <span className='device-row-name'>{displayName}</span>
      <ClickableIcon
        icon={<Trash2Icon />}
        variant='danger'
        label='Forget device'
        title='Forget device'
        onClick={() => {
          openDeleteDialog({
            name: displayName,
            onDeletionConfirm: () => {
              void forgetDevice(device.id);
            },
            oneClickConfirm: true,
          });
        }}
      />
    </li>
  );
};
