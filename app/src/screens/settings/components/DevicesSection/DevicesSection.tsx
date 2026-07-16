import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Button,
  GlassPanel,
  HorizontalDivider,
  LoadingIcon,
  PopUpContainer,
} from '@/components';
import { useOwnDevice } from '@/data-access-layer';
import { H2 } from '../H2/H2';
import { Section } from '../Section/Section';
import { OwnDevice, PairDeviceDialog, PairedDevices } from './components';
import './DevicesSection.css';

export const DevicesSection = () => {
  const { ownDevice } = useOwnDevice();
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
      <GlassPanel intensity='bright' className='devices-section-body'>
        {ownDevice !== null ? (
          <OwnDevice />
        ) : (
          // The controlled-input auto-save pattern initializes its state from the query value once, at mount — the input must not mount before data exists.
          <LoadingIcon />
        )}

        <HorizontalDivider />

        <PairedDevices />

        <Button
          className='devices-section--open-dialog-btn'
          label='Pair devices'
          onClick={() => {
            setPairDialogState('open');
            setDialogMounted(true);
          }}
        />

        {dialogMounted &&
          createPortal(
            <PopUpContainer
              state={pairDialogState}
              setState={setPairDialogState}
            >
              <PairDeviceDialog
                onClose={() => {
                  setPairDialogState('closed');
                }}
              />
            </PopUpContainer>,
            document.body,
          )}
      </GlassPanel>
    </Section>
  );
};
