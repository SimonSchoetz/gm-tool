export type DevicesLoadError = Error & { name: 'DevicesLoadError' };
export const devicesLoadError = (cause?: unknown): DevicesLoadError => {
  const error = new Error(
    `Failed to load devices: ${String(cause)}`,
  ) as DevicesLoadError;
  error.name = 'DevicesLoadError';
  return error;
};

export type DeviceCreateError = Error & { name: 'DeviceCreateError' };
export const deviceCreateError = (cause?: unknown): DeviceCreateError => {
  const error = new Error(
    `Failed to persist paired device: ${String(cause)}`,
  ) as DeviceCreateError;
  error.name = 'DeviceCreateError';
  return error;
};

export type DeviceUpdateError = Error & { name: 'DeviceUpdateError' };
export const deviceUpdateError = (cause?: unknown): DeviceUpdateError => {
  const error = new Error(
    `Failed to update device: ${String(cause)}`,
  ) as DeviceUpdateError;
  error.name = 'DeviceUpdateError';
  return error;
};

export type DeviceDeleteError = Error & { name: 'DeviceDeleteError' };
export const deviceDeleteError = (cause?: unknown): DeviceDeleteError => {
  const error = new Error(
    `Failed to forget device: ${String(cause)}`,
  ) as DeviceDeleteError;
  error.name = 'DeviceDeleteError';
  return error;
};

export type ConnectivityInitError = Error & { name: 'ConnectivityInitError' };
export const connectivityInitError = (
  cause?: unknown,
): ConnectivityInitError => {
  const error = new Error(
    `Failed to initialize connectivity: ${String(cause)}`,
  ) as ConnectivityInitError;
  error.name = 'ConnectivityInitError';
  return error;
};

export type PairingModeError = Error & { name: 'PairingModeError' };
export const pairingModeError = (cause?: unknown): PairingModeError => {
  const error = new Error(
    `Failed to enter or exit pairing mode: ${String(cause)}`,
  ) as PairingModeError;
  error.name = 'PairingModeError';
  return error;
};

export type PairingConfirmError = Error & { name: 'PairingConfirmError' };
export const pairingConfirmError = (cause?: unknown): PairingConfirmError => {
  const error = new Error(
    `Pairing confirmation failed: ${String(cause)}`,
  ) as PairingConfirmError;
  error.name = 'PairingConfirmError';
  return error;
};

export type DeviceMessageError = Error & { name: 'DeviceMessageError' };
export const deviceMessageError = (cause?: unknown): DeviceMessageError => {
  const error = new Error(
    `Failed to send device message: ${String(cause)}`,
  ) as DeviceMessageError;
  error.name = 'DeviceMessageError';
  return error;
};
