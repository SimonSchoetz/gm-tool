import { get } from './get';
import { update } from './update';
import { versioningDataSchema, type VersioningData } from './schema';

export const getVersioning = async (): Promise<VersioningData | null> => {
  const raw = await get('versioning');
  if (raw === null) return null;
  return versioningDataSchema.parse(JSON.parse(raw) as unknown);
};

export const updateVersioning = async (data: VersioningData): Promise<void> => {
  versioningDataSchema.parse(data);
  await update('versioning', JSON.stringify(data));
};
