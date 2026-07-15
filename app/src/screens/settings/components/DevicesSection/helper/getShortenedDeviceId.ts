export const getShortenedDeviceId = (deviceId: string): string => {
  return deviceId.slice(0, 8);
};
