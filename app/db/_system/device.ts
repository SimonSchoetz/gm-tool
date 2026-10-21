import { DEVICE_SYSTEM_KEY } from '@domain';
import { get } from './get';
import { update } from './update';
import { deviceDataSchema, type DeviceData } from './schema';

export const getDevice = async (): Promise<DeviceData | null> => {
  const raw = await get(DEVICE_SYSTEM_KEY);
  if (raw === null) return null;
  return deviceDataSchema.parse(JSON.parse(raw));
};

export const updateDevice = async (data: DeviceData): Promise<void> => {
  deviceDataSchema.parse(data);
  await update(DEVICE_SYSTEM_KEY, JSON.stringify(data));
};
