import { useUpdater } from '@/data-access-layer';
import { FCProps } from '@/types';
import { ActionContainer, LoadingIcon } from '@/components';
import './Updater.css';
import { useEffect, useState } from 'react';

type Props = object;

export const Updater: FCProps<Props> = () => {
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
  const [checkedForUpdate, setCheckedForUpdate] = useState(false);

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
    if (checkError) {
      setError(checkError.message);
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [checkError]);

  const handleClick = () => {
    const isProcessing = isChecking && isDownloading && isInstalling;
    if (isProcessing) return;

    if (!checkedForUpdate && !isChecking && !availableVersion) {
      handleCheckUpdate();
    }
    if (availableVersion && !isDownloading && !isDownloaded) {
      void downloadUpdate();
    }
    if (isDownloaded && !isInstalling) {
      void installAndRelaunch();
    }
  };

  return (
    <>
      {error ? (
        <span className='updater-error'>{error}</span>
      ) : (
        <ActionContainer
          onClick={handleClick}
          label='Update'
          className='updater'
        >
          {checkedForUpdate && !availableVersion && (
            <span className='updater--positive-msg'>Up to date!</span>
          )}

          {isChecking && <LoadingIcon />}

          {isDownloading && (
            <LoadingIcon beamLengthPercent={downloadProgress ?? 50} />
          )}

          {isInstalling && <LoadingIcon beamLengthPercent={100} />}

          {isDownloaded && !isInstalling && (
            <span className='updater--positive-msg'>Restart Now</span>
          )}

          {!checkedForUpdate &&
            !isChecking &&
            !isDownloading &&
            !isInstalling && (
              <>
                {!isDownloaded && <span>v{currentVersion}</span>}
                {availableVersion && !isDownloaded && (
                  <span> &rarr; v{availableVersion}</span>
                )}
              </>
            )}
        </ActionContainer>
      )}
    </>
  );
};
