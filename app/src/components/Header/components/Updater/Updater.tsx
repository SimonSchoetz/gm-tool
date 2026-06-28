import { useUpdater } from '@/data-access-layer';
import { FCProps } from '@/types';
import { ActionContainer } from '@/components';
import './Updater.css';
import { useEffect } from 'react';

type Props = object;

export const Updater: FCProps<Props> = () => {
  const {
    currentVersion,
    availableVersion,
    // checkError,
    checkUpdate,
    // downloadUpdate,
    // downloadProgress,
    // installAndRelaunch,
    // isDownloaded,
    isChecking,
    isDownloading,
    isInstalling,
  } = useUpdater();

  useEffect(() => {
    checkUpdate();
  }, []);

  const handleClick = () => {
    if (!isChecking && !availableVersion) {
      checkUpdate();
    }
  };

  return (
    <ActionContainer onClick={handleClick} label='Update' className='updater'>
      {isChecking && <span>Loading Icon here</span>}
      {isDownloading && <span>Download progress here</span>}
      {isInstalling && <span>Installing progress here</span>}
      {!isChecking && !isDownloading && <span>v{currentVersion}</span>}
      {availableVersion && <span>v{availableVersion}</span>}
    </ActionContainer>
  );
};
