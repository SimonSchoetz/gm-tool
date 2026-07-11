import { get } from './get';
import { update } from './update';
import { deviceDataSchema, type DeviceData } from './schema';

export const getDevice = async (): Promise<DeviceData | null> => {
  const raw = await get('device');
  if (raw === null) return null;
  return deviceDataSchema.parse(JSON.parse(raw));
};

export const updateDevice = async (data: DeviceData): Promise<void> => {
  deviceDataSchema.parse(data);
  await update('device', JSON.stringify(data));
};
