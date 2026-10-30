import { resolveAppDataDir } from '../../installedAppData';
import { readAppIdentifiers } from '../../repositoryJson';

// The release and dev app data directories under a test's own home directory, as the mirror and web mode resolve them on macOS.
export const appDataDirectories = (
  homeDir: string,
): { releaseDir: string; devDir: string } => {
  const identifiers = readAppIdentifiers();
  return {
    releaseDir: resolveAppDataDir('darwin', homeDir, identifiers.release),
    devDir: resolveAppDataDir('darwin', homeDir, identifiers.dev),
  };
};
