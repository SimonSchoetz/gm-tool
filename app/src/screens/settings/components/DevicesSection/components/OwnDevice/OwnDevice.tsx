import { SyncedInput } from '@/components/SyncedInput/SyncedInput';
import { useOwnDevice } from '@/data-access-layer';
import './OwnDevice.css';
import { H3 } from '../../../H3/H3';
import { getShortenedDeviceId } from '../../helper/getShortenedDeviceId';

// Isolated so the input's display state mounts only when the own-device value is already in the query cache (the parent gates on ownDevice !== null).
export const OwnDevice = () => {
  const { ownDevice, renameOwnDevice } = useOwnDevice();

  if (!ownDevice) return;

  return (
    <div className='own-device'>
      <H3 heading='This device' />
      <SyncedInput
        className='own-device--input'
        initValue={ownDevice.name ?? ''}
        onCommit={renameOwnDevice}
        placeholder={`Device ID: ${getShortenedDeviceId(ownDevice.id)}`}
      />
    </div>
  );
};
