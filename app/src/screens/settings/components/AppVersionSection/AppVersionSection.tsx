import {
  useAppVersion,
  useCheckUpdate,
  useDownloadUpdate,
  useInstallAndRelaunch,
} from '@/data-access-layer';
import { Button } from '@/components';
import './AppVersionSection.css';

export const AppVersionSection = () => {
  const { currentVersion } = useAppVersion();
  const { availableVersion, isChecking, checkError, checkUpdate } =
    useCheckUpdate();
  const { downloadUpdate, isDownloading, downloadProgress, isDownloaded } =
    useDownloadUpdate();
  const { installAndRelaunch, isInstalling } = useInstallAndRelaunch();

  return (
    <section className='app-version-section'>
      <h2 className='app-version-section-heading'>App Version</h2>
      <p className='app-version-section-current'>{currentVersion ?? '—'}</p>
      {availableVersion && (
        <p className='app-version-section-available'>
          Update available: {availableVersion}
        </p>
      )}
      {isDownloading && (
        <p className='app-version-section-progress'>
          {downloadProgress !== null
            ? `Downloading... ${downloadProgress}%`
            : 'Downloading...'}
        </p>
      )}
      {checkError && (
        <p className='app-version-section-error'>{checkError.message}</p>
      )}
      <div className='app-version-section-actions'>
        {!isDownloading && !isDownloaded && (
          <Button
            label={isChecking ? 'Checking...' : 'Check for Updates'}
            onClick={checkUpdate}
            disabled={isChecking}
          />
        )}
        {availableVersion && !isDownloading && !isDownloaded && (
          <Button
            label='Download Update'
            onClick={() => {
              void downloadUpdate();
            }}
          />
        )}
        {isDownloaded && (
          <Button
            label={isInstalling ? 'Installing...' : 'Restart Now'}
            onClick={() => {
              void installAndRelaunch();
            }}
            disabled={isInstalling}
          />
        )}
      </div>
    </section>
  );
};
