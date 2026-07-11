import { GlassPanel, HorizontalDivider, LoadingIcon } from '@/components';
import {
  useConnectedPeers,
  useOwnDevice,
  usePairedDevices,
} from '@/data-access-layer';
import { H2 } from '../H2/H2';
import { Section } from '../Section/Section';
import { DeviceRow, OwnDeviceCard } from './components';
import './DevicesSection.css';

export const DevicesSection = () => {
  const { ownDevice } = useOwnDevice();
  const { pairedDevices, loading } = usePairedDevices();
  const { connectedIds } = useConnectedPeers();

  return (
    <Section>
      <H2 heading='Devices' />

      {ownDevice !== null ? (
        <OwnDeviceCard />
      ) : (
        // The controlled-input auto-save pattern initializes its state from the query
        // value once, at mount — the input must not mount before data exists.
        <GlassPanel intensity='bright' className='devices-section-own'>
          <LoadingIcon />
        </GlassPanel>
      )}

      <HorizontalDivider />

      {loading ? (
        <div className='content-center'>Loading...</div>
      ) : pairedDevices.length === 0 ? (
        <p className='devices-section-empty'>No paired devices yet.</p>
      ) : (
        <ul className='devices-section-list'>
          {pairedDevices.map((device) => (
            <DeviceRow
              key={device.id}
              device={device}
              connected={connectedIds.includes(device.id)}
            />
          ))}
        </ul>
      )}
    </Section>
  );
};
