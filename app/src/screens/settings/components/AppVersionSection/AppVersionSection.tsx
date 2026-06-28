import { useUpdater } from '@/data-access-layer';
import { Button } from '@/components';
import './AppVersionSection.css';
import { H2 } from '../H2/H2';
import { Section } from '../Section/Section';

export const AppVersionSection = () => {
  const {
    currentVersion,
    availableVersion,
    isChecking,
    checkError,
    checkUpdate,
    downloadUpdate,
    isDownloading,
    downloadProgress,
    isDownloaded,
    installAndRelaunch,
    isInstalling,
  } = useUpdater();

  return (
    <Section>
      <H2 heading='App Version' />
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
    </Section>
  );
};
