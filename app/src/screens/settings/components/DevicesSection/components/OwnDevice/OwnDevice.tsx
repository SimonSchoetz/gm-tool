import { useState } from 'react';
import { Input } from '@/components';
import { useOwnDevice } from '@/data-access-layer';
import './OwnDevice.css';
import { H3 } from '../../../H3/H3';
import { getShortenedDeviceId } from '../../helper';

// Isolated so the controlled-input state mounts only when the own-device value is
// already in the query cache (the parent gates on ownDevice !== null).
export const OwnDevice = () => {
  const { ownDevice, renameOwnDevice } = useOwnDevice();
  const [name, setName] = useState(ownDevice?.name ?? '');

  if (!ownDevice) return null;

  return (
    <div className='own-device'>
      <H3 heading='This device' />
      <Input
        className='own-device--input'
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          renameOwnDevice(e.target.value);
        }}
        placeholder={`Device ID: ${getShortenedDeviceId(ownDevice.id)}`}
      />
    </div>
  );
};
