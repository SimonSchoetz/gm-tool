import { useAppVersion, useCheckUpdate, useInstallUpdate } from '@/data-access-layer';
import { Button } from '@/components';
import './AppVersionSection.css';

export const AppVersionSection = () => {
  const { currentVersion } = useAppVersion();
  const { availableVersion, isChecking, checkUpdate } = useCheckUpdate();
  const { installUpdate, isInstalling } = useInstallUpdate();

  return (
    <section className='app-version-section'>
      <h2 className='app-version-section-heading'>App Version</h2>
      <p className='app-version-section-current'>{currentVersion ?? '—'}</p>
      {availableVersion && (
        <p className='app-version-section-available'>
          Update available: {availableVersion}
        </p>
      )}
      <div className='app-version-section-actions'>
        <Button
          label={isChecking ? 'Checking...' : 'Check for Updates'}
          onClick={checkUpdate}
          disabled={isChecking}
        />
        {availableVersion && (
          <Button
            label={isInstalling ? 'Installing...' : 'Install Update'}
            onClick={() => {
              void installUpdate();
            }}
            disabled={isInstalling}
          />
        )}
      </div>
    </section>
  );
};
