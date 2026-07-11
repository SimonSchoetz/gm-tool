import { invoke } from '@tauri-apps/api/core';
import * as pairedDeviceDb from '@db/paired-device';
import type { PairedDevice } from '@db/paired-device';
import { getDevice, updateDevice, type DeviceData } from '@db/_system';
import {
  buildHelloEnvelope,
  buildNameUpdateEnvelope,
  buildUnpairEnvelope,
  deviceMessageEnvelopeSchema,
  devicesLoadError,
  deviceCreateError,
  deviceUpdateError,
  deviceDeleteError,
  connectivityInitError,
  pairingModeError,
  pairingConfirmError,
  deviceMessageError,
} from '@domain';

export const initializeConnectivity = async (): Promise<void> => {
  try {
    const peers = await pairedDeviceDb.getAll();
    const stored = await getDevice();
    const id = await invoke<string>('init_connectivity', {
      ownName: stored?.name ?? null,
      trustedPeers: peers.map((peer) => ({
        endpointId: peer.id,
        name: peer.name ?? null,
      })),
    });
    // The _system write runs on every init: the Rust key file is the identity source
    // of truth, so a divergent stored id (e.g. after the key file was deleted)
    // self-heals here.
    await updateDevice({ id, name: stored?.name ?? null });
  } catch (cause) {
    throw connectivityInitError(cause);
  }
};

export const getOwnDevice = async (): Promise<DeviceData | null> => {
  try {
    return await getDevice();
  } catch (cause) {
    throw devicesLoadError(cause);
  }
};

export const getPairedDevices = async (): Promise<PairedDevice[]> => {
  try {
    return await pairedDeviceDb.getAll();
  } catch (cause) {
    throw devicesLoadError(cause);
  }
};

export const getConnectedPeers = async (): Promise<string[]> => {
  try {
    return await invoke<string[]>('get_connected_peers');
  } catch (cause) {
    throw devicesLoadError(cause);
  }
};

export const renameOwnDevice = async (name: string | null): Promise<void> => {
  try {
    const stored = await getDevice();
    if (stored === null) {
      throw new Error('rename before connectivity init is not possible');
    }
    await updateDevice({ id: stored.id, name });
    await invoke('update_own_name', { name });
    const connected = await invoke<string[]>('get_connected_peers');
    for (const endpointId of connected) {
      try {
        await invoke('send_message', {
          endpointId,
          envelope: JSON.stringify(buildNameUpdateEnvelope(name)),
        });
      } catch {
        // A peer disconnecting mid-broadcast must not fail the rename — the peer
        // receives a hello with the current name on its next connect.
      }
    }
  } catch (cause) {
    throw deviceUpdateError(cause);
  }
};

export const sendHello = async (endpointId: string): Promise<void> => {
  try {
    const stored = await getDevice();
    await invoke('send_message', {
      endpointId,
      envelope: JSON.stringify(buildHelloEnvelope(stored?.name ?? null)),
    });
  } catch (cause) {
    throw deviceMessageError(cause);
  }
};

export const enterPairingMode = async (): Promise<string> => {
  try {
    return await invoke<string>('enter_pairing_mode');
  } catch (cause) {
    throw pairingModeError(cause);
  }
};

export const exitPairingMode = async (): Promise<void> => {
  try {
    await invoke('exit_pairing_mode');
  } catch (cause) {
    throw pairingModeError(cause);
  }
};

export const submitPairingCode = async (
  endpointId: string,
  code: string,
): Promise<void> => {
  try {
    await invoke('submit_pairing_code', { endpointId, code });
  } catch (cause) {
    throw pairingConfirmError(cause);
  }
};

export const completePairing = async (
  endpointId: string,
  name: string | null,
): Promise<void> => {
  try {
    // Both sides emit pairing-succeeded, and StrictMode double-subscription in dev
    // can deliver the event twice — an existing row means the work is already done.
    const existing = await pairedDeviceDb.get(endpointId);
    if (existing !== null) return;
    await pairedDeviceDb.create({ id: endpointId, name });
  } catch (cause) {
    throw deviceCreateError(cause);
  }
};

export const forgetDevice = async (endpointId: string): Promise<void> => {
  try {
    try {
      await invoke('send_message', {
        endpointId,
        envelope: JSON.stringify(buildUnpairEnvelope()),
      });
    } catch {
      // Best-effort: the peer may be offline — the unpair guarantee is local-first.
    }
    await invoke('remove_trusted_peer', { endpointId });
    await pairedDeviceDb.remove(endpointId);
  } catch (cause) {
    throw deviceDeleteError(cause);
  }
};

export const handlePeerMessage = async (
  endpointId: string,
  rawEnvelope: string,
): Promise<'ignored' | 'devices-changed'> => {
  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawEnvelope);
    } catch {
      // A malformed frame from a hostile or future peer must not crash the app.
      return 'ignored';
    }
    const result = deviceMessageEnvelopeSchema.safeParse(parsed);
    if (!result.success) return 'ignored';

    const envelope = result.data;
    if (envelope.type === 'unpair') {
      await invoke('remove_trusted_peer', { endpointId });
      await pairedDeviceDb.remove(endpointId);
      return 'devices-changed';
    }

    const existing = await pairedDeviceDb.get(endpointId);
    // A message from an untrusted id cannot reach here through the ALPN gate, but a
    // row deleted mid-session can race — do not resurrect it.
    if (existing === null) return 'ignored';
    if (existing.name === envelope.payload.name) return 'ignored';
    await pairedDeviceDb.update(endpointId, { name: envelope.payload.name });
    return 'devices-changed';
  } catch (cause) {
    throw deviceUpdateError(cause);
  }
};
