import './PairedDevices.css';
import { usePairedDevices } from '@/data-access-layer';
import { LoadingIcon } from '@/components';
import { DeviceRow } from './components';
import { H3 } from '../../../H3/H3';

export const PairedDevices = () => {
  const { pairedDevices, loading } = usePairedDevices();

  return (
    <div className='paired-devices'>
      <H3 heading='Paired Devices' />
      {loading ? (
        <div className='content-center'>
          <LoadingIcon />
        </div>
      ) : pairedDevices.length === 0 ? (
        <p className='paired-devices--empty'>No paired devices yet.</p>
      ) : (
        <ul className='paired-devices--list'>
          {pairedDevices.map((device) => (
            <DeviceRow key={device.id} device={device} />
          ))}
        </ul>
      )}
    </div>
  );
};
