import { UnlinkIcon } from 'lucide-react';
import type { PairedDevice } from '@db/paired-device';
import { ClickableIcon } from '@/components/ClickableIcon/ClickableIcon';
import {
  useConnectedPeers,
  usePairedDevices,
  usePeerSyncCompat,
} from '@/data-access-layer';
import { useDeleteDialog } from '@/providers/DeleteDialogProvider';
import type { FCProps } from '@/types/fcProps.type';
import { StatusIndicator } from './components/StatusIndicator/StatusIndicator';
import './DeviceRow.css';
import { getShortenedDeviceId } from '../../../../helper/getShortenedDeviceId';
import { derivePeerStatus } from './helper/derivePeerStatus';

type Props = {
  device: PairedDevice;
};

export const DeviceRow: FCProps<Props> = ({ device }) => {
  const { forgetDevice } = usePairedDevices();
  const { connectedIds } = useConnectedPeers();
  const { compatById } = usePeerSyncCompat();
  const status = derivePeerStatus(
    connectedIds.includes(device.id),
    compatById[device.id] ?? null,
  );
  const { openDeleteDialog } = useDeleteDialog();

  const displayName =
    (!!device.name && device.name) || getShortenedDeviceId(device.id);

  return (
    <li className='device-row'>
      <StatusIndicator status={status} />
      <span className='device-row-name clip-text'>{displayName}</span>
      <ClickableIcon
        icon={<UnlinkIcon />}
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
