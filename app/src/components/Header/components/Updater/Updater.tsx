import { useUpdater } from '@/data-access-layer';
import { ActionContainer, LoadingIcon } from '@/components';
import './Updater.css';
import { useEffect, useState } from 'react';

export const Updater = () => {
  const {
    currentVersion,
    availableVersion,
    checkError,
    checkUpdate,
    downloadUpdate,
    downloadProgress,
    installAndRelaunch,
    isDownloaded,
    isChecking,
    isDownloading,
    isInstalling,
  } = useUpdater();

  const [error, setError] = useState<string | null>(null);
  const [lastCheckError, setLastCheckError] = useState(checkError);
  const [checkedForUpdate, setCheckedForUpdate] = useState(false);

  if (checkError !== lastCheckError) {
    setLastCheckError(checkError);
    setError(checkError ? checkError.message : null);
  }

  const handleCheckUpdate = () => {
    checkUpdate();
    setCheckedForUpdate(true);
    const timer = setTimeout(() => {
      setCheckedForUpdate(false);
    }, 2000);
    return () => {
      clearTimeout(timer);
    };
  };

  // initial silent check on mount
  useEffect(() => {
    checkUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- should only check once on mount
  }, []);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => {
      setError(null);
    }, 5000);
    return () => {
      clearTimeout(timer);
    };
  }, [error]);

  const isProcessing =
    isChecking || isDownloading || isInstalling || checkedForUpdate || !!error;

  const handleClick = () => {
    if (isProcessing) return;

    if (!availableVersion) {
      handleCheckUpdate();
    }
    if (availableVersion && !isDownloaded) {
      void downloadUpdate();
    }
    if (isDownloaded) {
      void installAndRelaunch();
    }
  };

  return (
    <ActionContainer onClick={handleClick} label='Update' className='updater'>
      {checkedForUpdate && !isChecking && (
        <span className='updater--positive-msg'>
          {availableVersion ? 'Update available!' : 'Up to date!'}
        </span>
      )}

      {isChecking && <LoadingIcon />}

      {isDownloading && (
        <LoadingIcon beamLengthPercent={downloadProgress ?? 50} />
      )}

      {isInstalling && <LoadingIcon beamLengthPercent={100} />}

      {isDownloaded && !isInstalling && (
        <span className='updater--positive-msg'>Restart Now</span>
      )}

      {!isProcessing && !isDownloaded && (
        <>
          {<span>v{currentVersion}</span>}
          {availableVersion && <span> &rarr; v{availableVersion}</span>}
        </>
      )}

      {error && <span className='updater-error'>{error}</span>}
    </ActionContainer>
  );
};
