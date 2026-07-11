import { useState } from 'react';
import { GlassPanel, Input } from '@/components';
import { useOwnDevice } from '@/data-access-layer';
import './OwnDeviceCard.css';

// Isolated so the controlled-input state mounts only when the own-device value is
// already in the query cache (the parent gates on ownDevice !== null).
export const OwnDeviceCard = () => {
  const { ownDevice, renameOwnDevice } = useOwnDevice();
  const [name, setName] = useState(ownDevice?.name ?? '');

  return (
    <GlassPanel intensity='bright' className='own-device-card'>
      <label className='own-device-card--content'>
        <span>This device&apos;s name</span>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            renameOwnDevice(e.target.value);
          }}
          placeholder='Unnamed device'
        />
      </label>
    </GlassPanel>
  );
};
