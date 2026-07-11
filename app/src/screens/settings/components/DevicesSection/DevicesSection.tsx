import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Button,
  GlassPanel,
  HorizontalDivider,
  LoadingIcon,
  PopUpContainer,
} from '@/components';
import {
  useConnectedPeers,
  useOwnDevice,
  usePairedDevices,
} from '@/data-access-layer';
import { H2 } from '../H2/H2';
import { Section } from '../Section/Section';
import { DeviceRow, OwnDeviceCard, PairDeviceDialog } from './components';
import './DevicesSection.css';

export const DevicesSection = () => {
  const { ownDevice } = useOwnDevice();
  const { pairedDevices, loading } = usePairedDevices();
  const { connectedIds } = useConnectedPeers();
  const [pairDialogState, setPairDialogState] = useState<'open' | 'closed'>(
    'closed',
  );
  const [dialogMounted, setDialogMounted] = useState(false);

  // Unmount only after the close animation has played (mirrors DeleteDialogProvider);
  // unmounting PairDeviceDialog is what exits pairing mode via its hook cleanup.
  useEffect(() => {
    if (pairDialogState === 'closed') {
      const timeout = setTimeout(() => {
        setDialogMounted(false);
      }, 500);
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [pairDialogState]);

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

      <Button
        label='Pair new device'
        onClick={() => {
          setPairDialogState('open');
          setDialogMounted(true);
        }}
      />

      {dialogMounted &&
        createPortal(
          <PopUpContainer state={pairDialogState} setState={setPairDialogState}>
            <PairDeviceDialog
              onClose={() => {
                setPairDialogState('closed');
              }}
            />
          </PopUpContainer>,
          document.body,
        )}
    </Section>
  );
};
