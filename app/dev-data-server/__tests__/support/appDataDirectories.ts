import { resolveInstalledAppDataDir } from '../../installedAppData';
import { readRepositoryJson, tauriConfigSchema } from '../../repositoryJson';

// The release and dev app data directories under a test's own home directory, as the mirror resolves them on macOS.
export const appDataDirectories = (
  homeDir: string,
): { releaseDir: string; devDir: string } => ({
  releaseDir: resolveInstalledAppDataDir(
    'darwin',
    homeDir,
    readRepositoryJson('../src-tauri/tauri.conf.json', tauriConfigSchema)
      .identifier,
  ),
  devDir: resolveInstalledAppDataDir(
    'darwin',
    homeDir,
    readRepositoryJson('../src-tauri/tauri.dev.conf.json', tauriConfigSchema)
      .identifier,
  ),
});
