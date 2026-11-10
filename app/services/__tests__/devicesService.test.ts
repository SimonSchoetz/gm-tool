import { describe, it, expect, beforeEach, vi } from 'vitest';
import type * as platformModule from '@platform';
import type * as pairedDeviceDb from '@db/paired-device';
import type * as systemDb from '@db/_system';
import type * as syncDb from '@db/_sync';
import {
  buildHelloEnvelope,
  buildNameUpdateEnvelope,
  buildUnpairEnvelope,
} from '@domain';
import { buildPairedDevice } from './support/pairedDeviceFixtures';

const invoke = vi.hoisted(() => vi.fn<typeof platformModule.invoke>());
const getAllPaired = vi.hoisted(() => vi.fn<typeof pairedDeviceDb.getAll>());
const getPaired = vi.hoisted(() => vi.fn<typeof pairedDeviceDb.get>());
const createPaired = vi.hoisted(() => vi.fn<typeof pairedDeviceDb.create>());
const removePaired = vi.hoisted(() => vi.fn<typeof pairedDeviceDb.remove>());
const updatePaired = vi.hoisted(() => vi.fn<typeof pairedDeviceDb.update>());
const getDevice = vi.hoisted(() => vi.fn<typeof systemDb.getDevice>());
const updateDevice = vi.hoisted(() => vi.fn<typeof systemDb.updateDevice>());
const removePeerState = vi.hoisted(() =>
  vi.fn<typeof syncDb.removePeerState>(),
);

vi.mock('@platform', () => ({ invoke }));
vi.mock('@db/paired-device', () => ({
  getAll: getAllPaired,
  get: getPaired,
  create: createPaired,
  remove: removePaired,
  update: updatePaired,
}));
vi.mock('@db/_system', () => ({ getDevice, updateDevice }));
vi.mock('@db/_sync', () => ({ removePeerState }));

const OWN_ID = 'a'.repeat(64);
const ownDevice = (name: string | null) => ({ id: OWN_ID, name });

beforeEach(() => {
  vi.resetModules();
  invoke.mockReset().mockResolvedValue(undefined);
  getAllPaired.mockReset().mockResolvedValue([]);
  getPaired.mockReset().mockResolvedValue(null);
  createPaired.mockReset().mockResolvedValue('peer');
  removePaired.mockReset().mockResolvedValue();
  updatePaired.mockReset().mockResolvedValue();
  getDevice.mockReset().mockResolvedValue(null);
  updateDevice.mockReset().mockResolvedValue();
  removePeerState.mockReset().mockResolvedValue();
});

describe('initializeConnectivity', () => {
  it('initializes the endpoint with the stored own name and the paired devices as trusted peers, then stores the id it returns', async () => {
    const { initializeConnectivity } = await import('../devicesService');
    getAllPaired.mockResolvedValue([
      buildPairedDevice({ id: 'p1', name: 'Phone' }),
      buildPairedDevice({ id: 'p2', name: null }),
    ]);
    getDevice.mockResolvedValue(ownDevice('My laptop'));
    invoke.mockResolvedValue('new-endpoint-id');

    await initializeConnectivity();

    expect(invoke).toHaveBeenCalledWith('init_connectivity', {
      ownName: 'My laptop',
      trustedPeers: [
        { endpointId: 'p1', name: 'Phone' },
        { endpointId: 'p2', name: null },
      ],
    });
    expect(updateDevice).toHaveBeenCalledWith({
      id: 'new-endpoint-id',
      name: 'My laptop',
    });
    expect(invoke.mock.invocationCallOrder[0]).toBeLessThan(
      updateDevice.mock.invocationCallOrder[0],
    );
  });

  it('initializes a device that has no stored row with no name', async () => {
    const { initializeConnectivity } = await import('../devicesService');
    invoke.mockResolvedValue('first-id');

    await initializeConnectivity();

    expect(invoke).toHaveBeenCalledWith('init_connectivity', {
      ownName: null,
      trustedPeers: [],
    });
    expect(updateDevice).toHaveBeenCalledWith({ id: 'first-id', name: null });
  });

  it('rejects as ConnectivityInitError, storing no id, when the endpoint cannot be initialized', async () => {
    const { initializeConnectivity } = await import('../devicesService');
    invoke.mockRejectedValue(new Error('no network'));

    await expect(initializeConnectivity()).rejects.toMatchObject({
      name: 'ConnectivityInitError',
    });
    expect(updateDevice).not.toHaveBeenCalled();
  });

  it('rejects as ConnectivityInitError when the paired devices or the stored device cannot be read, or the id cannot be stored', async () => {
    const { initializeConnectivity } = await import('../devicesService');
    getAllPaired.mockRejectedValueOnce(new Error('disk'));

    await expect(initializeConnectivity()).rejects.toMatchObject({
      name: 'ConnectivityInitError',
    });

    getDevice.mockRejectedValueOnce(new Error('disk'));

    await expect(initializeConnectivity()).rejects.toMatchObject({
      name: 'ConnectivityInitError',
    });

    invoke.mockResolvedValue('id');
    updateDevice.mockRejectedValueOnce(new Error('disk'));

    await expect(initializeConnectivity()).rejects.toMatchObject({
      name: 'ConnectivityInitError',
    });
  });
});

describe('the loading functions', () => {
  it('return the stored device, the paired devices and the connected peers', async () => {
    const { getOwnDevice, getPairedDevices, getConnectedPeers } =
      await import('../devicesService');
    const paired = [buildPairedDevice({ id: 'p1' })];
    getDevice.mockResolvedValue(ownDevice('Mine'));
    getAllPaired.mockResolvedValue(paired);
    invoke.mockResolvedValue(['p1', 'p2']);

    await expect(getOwnDevice()).resolves.toEqual(ownDevice('Mine'));
    await expect(getPairedDevices()).resolves.toEqual(paired);
    await expect(getConnectedPeers()).resolves.toEqual(['p1', 'p2']);
    expect(invoke).toHaveBeenCalledWith('get_connected_peers');
  });

  it('return no stored device as null', async () => {
    const { getOwnDevice } = await import('../devicesService');

    await expect(getOwnDevice()).resolves.toBeNull();
  });

  it('reject as DevicesLoadError when the load fails', async () => {
    const { getOwnDevice, getPairedDevices, getConnectedPeers } =
      await import('../devicesService');
    getDevice.mockRejectedValue(new Error('disk'));
    getAllPaired.mockRejectedValue(new Error('disk'));
    invoke.mockRejectedValue(new Error('down'));

    for (const load of [getOwnDevice, getPairedDevices, getConnectedPeers]) {
      await expect(load()).rejects.toMatchObject({ name: 'DevicesLoadError' });
    }
  });
});

describe('renameOwnDevice', () => {
  it('stores the name under the stored id, tells the connectivity core, and sends the name update to every connected peer', async () => {
    const { renameOwnDevice } = await import('../devicesService');
    getDevice.mockResolvedValue(ownDevice('Old'));
    invoke.mockImplementation((command) =>
      Promise.resolve(
        command === 'get_connected_peers' ? ['p1', 'p2'] : undefined,
      ),
    );

    await renameOwnDevice('New');

    expect(updateDevice).toHaveBeenCalledWith({ id: OWN_ID, name: 'New' });
    expect(invoke.mock.calls).toEqual([
      ['update_own_name', { name: 'New' }],
      ['get_connected_peers'],
      [
        'send_message',
        {
          endpointId: 'p1',
          envelope: JSON.stringify(buildNameUpdateEnvelope('New')),
        },
      ],
      [
        'send_message',
        {
          endpointId: 'p2',
          envelope: JSON.stringify(buildNameUpdateEnvelope('New')),
        },
      ],
    ]);
  });

  it('can clear the name, and sends the cleared name to the peers', async () => {
    const { renameOwnDevice } = await import('../devicesService');
    getDevice.mockResolvedValue(ownDevice('Old'));
    invoke.mockImplementation((command) =>
      Promise.resolve(command === 'get_connected_peers' ? ['p1'] : undefined),
    );

    await renameOwnDevice(null);

    expect(updateDevice).toHaveBeenCalledWith({ id: OWN_ID, name: null });
    expect(invoke).toHaveBeenCalledWith('send_message', {
      endpointId: 'p1',
      envelope: JSON.stringify(buildNameUpdateEnvelope(null)),
    });
  });

  it('still sends to the remaining peers, and does not fail, when one peer cannot be reached', async () => {
    const { renameOwnDevice } = await import('../devicesService');
    getDevice.mockResolvedValue(ownDevice('Old'));
    invoke.mockImplementation((command, args) => {
      if (command === 'get_connected_peers')
        return Promise.resolve(['p1', 'p2']);
      if (command === 'send_message' && args?.endpointId === 'p1') {
        return Promise.reject(new Error('gone'));
      }
      return Promise.resolve(undefined);
    });

    await expect(renameOwnDevice('New')).resolves.toBeUndefined();

    expect(
      invoke.mock.calls.filter(([command]) => command === 'send_message'),
    ).toHaveLength(2);
  });

  it('rejects as DeviceUpdateError, storing and sending nothing, before connectivity is initialized', async () => {
    const { renameOwnDevice } = await import('../devicesService');

    await expect(renameOwnDevice('New')).rejects.toMatchObject({
      name: 'DeviceUpdateError',
      message:
        'Failed to update device: Error: rename before connectivity init is not possible',
    });
    expect(updateDevice).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('rejects as DeviceUpdateError when the name cannot be stored or the core cannot be told', async () => {
    const { renameOwnDevice } = await import('../devicesService');
    getDevice.mockResolvedValue(ownDevice('Old'));
    updateDevice.mockRejectedValueOnce(new Error('disk'));

    await expect(renameOwnDevice('New')).rejects.toMatchObject({
      name: 'DeviceUpdateError',
    });
    expect(invoke).not.toHaveBeenCalled();

    invoke.mockRejectedValueOnce(new Error('down'));

    await expect(renameOwnDevice('New')).rejects.toMatchObject({
      name: 'DeviceUpdateError',
    });
  });
});

describe('sendHello', () => {
  it('sends a hello with the stored own name to the peer', async () => {
    const { sendHello } = await import('../devicesService');
    getDevice.mockResolvedValue(ownDevice('Mine'));

    await sendHello('p1');

    expect(invoke).toHaveBeenCalledWith('send_message', {
      endpointId: 'p1',
      envelope: JSON.stringify(buildHelloEnvelope('Mine')),
    });
  });

  it('sends a hello with no name when there is no stored device', async () => {
    const { sendHello } = await import('../devicesService');

    await sendHello('p1');

    expect(invoke).toHaveBeenCalledWith('send_message', {
      endpointId: 'p1',
      envelope: JSON.stringify(buildHelloEnvelope(null)),
    });
  });

  it('rejects as DeviceMessageError when the device cannot be read or the message cannot be sent', async () => {
    const { sendHello } = await import('../devicesService');
    getDevice.mockRejectedValueOnce(new Error('disk'));

    await expect(sendHello('p1')).rejects.toMatchObject({
      name: 'DeviceMessageError',
    });

    invoke.mockRejectedValueOnce(new Error('down'));

    await expect(sendHello('p1')).rejects.toMatchObject({
      name: 'DeviceMessageError',
    });
  });
});

describe('the pairing commands', () => {
  it('invoke the command with the arguments of the call, and return the pairing code of enter_pairing_mode', async () => {
    const {
      enterPairingMode,
      exitPairingMode,
      submitPairingCode,
      requestPairingCode,
    } = await import('../devicesService');
    invoke.mockResolvedValueOnce('123456');

    await expect(enterPairingMode()).resolves.toBe('123456');
    await exitPairingMode();
    await submitPairingCode('p1', '654321');
    await requestPairingCode('p1');

    expect(invoke.mock.calls).toEqual([
      ['enter_pairing_mode'],
      ['exit_pairing_mode'],
      ['submit_pairing_code', { endpointId: 'p1', code: '654321' }],
      ['request_pairing_code', { endpointId: 'p1' }],
    ]);
  });

  it('reject as the error of their own command when it fails', async () => {
    const {
      enterPairingMode,
      exitPairingMode,
      submitPairingCode,
      requestPairingCode,
    } = await import('../devicesService');
    invoke.mockRejectedValue(new Error('down'));

    await expect(enterPairingMode()).rejects.toMatchObject({
      name: 'PairingModeError',
    });
    await expect(exitPairingMode()).rejects.toMatchObject({
      name: 'PairingModeError',
    });
    await expect(submitPairingCode('p1', '1')).rejects.toMatchObject({
      name: 'PairingConfirmError',
    });
    await expect(requestPairingCode('p1')).rejects.toMatchObject({
      name: 'PairingRequestError',
    });
  });
});

describe('completePairing', () => {
  it('stores the device under its endpoint id with the name it announced', async () => {
    const { completePairing } = await import('../devicesService');

    await completePairing('p1', 'Phone');

    expect(getPaired).toHaveBeenCalledWith('p1');
    expect(createPaired).toHaveBeenCalledWith({ id: 'p1', name: 'Phone' });
  });

  it('stores nothing for a device that is already paired, which a second pairing-succeeded event may announce', async () => {
    const { completePairing } = await import('../devicesService');
    getPaired.mockResolvedValue(buildPairedDevice({ id: 'p1' }));

    await completePairing('p1', 'Phone');

    expect(createPaired).not.toHaveBeenCalled();
  });

  it('rejects as DeviceCreateError when the lookup or the creation fails', async () => {
    const { completePairing } = await import('../devicesService');
    getPaired.mockRejectedValueOnce(new Error('disk'));

    await expect(completePairing('p1', null)).rejects.toMatchObject({
      name: 'DeviceCreateError',
    });
    expect(createPaired).not.toHaveBeenCalled();

    createPaired.mockRejectedValueOnce(new Error('disk'));

    await expect(completePairing('p1', null)).rejects.toMatchObject({
      name: 'DeviceCreateError',
    });
  });
});

describe('forgetDevice', () => {
  it('tells the peer to unpair, removes it as a trusted peer, then removes the device and its sync state, in that order', async () => {
    const { forgetDevice } = await import('../devicesService');

    await forgetDevice('p1');

    expect(invoke.mock.calls).toEqual([
      [
        'send_message',
        { endpointId: 'p1', envelope: JSON.stringify(buildUnpairEnvelope()) },
      ],
      ['remove_trusted_peer', { endpointId: 'p1' }],
    ]);
    expect(removePaired).toHaveBeenCalledWith('p1');
    expect(removePeerState).toHaveBeenCalledWith('p1');
    expect(invoke.mock.invocationCallOrder[1]).toBeLessThan(
      removePaired.mock.invocationCallOrder[0],
    );
    expect(removePaired.mock.invocationCallOrder[0]).toBeLessThan(
      removePeerState.mock.invocationCallOrder[0],
    );
  });

  it('forgets the device even when the unpair message cannot be delivered', async () => {
    const { forgetDevice } = await import('../devicesService');
    invoke.mockImplementation((command) =>
      command === 'send_message'
        ? Promise.reject(new Error('offline'))
        : Promise.resolve(undefined),
    );

    await expect(forgetDevice('p1')).resolves.toBeUndefined();

    expect(invoke).toHaveBeenCalledWith('remove_trusted_peer', {
      endpointId: 'p1',
    });
    expect(removePaired).toHaveBeenCalledWith('p1');
    expect(removePeerState).toHaveBeenCalledWith('p1');
  });

  it('rejects as DeviceDeleteError, removing no later record, when a step after the message fails', async () => {
    const { forgetDevice } = await import('../devicesService');
    invoke.mockImplementation((command) =>
      command === 'remove_trusted_peer'
        ? Promise.reject(new Error('down'))
        : Promise.resolve(undefined),
    );

    await expect(forgetDevice('p1')).rejects.toMatchObject({
      name: 'DeviceDeleteError',
    });
    expect(removePaired).not.toHaveBeenCalled();

    invoke.mockResolvedValue(undefined);
    removePaired.mockRejectedValueOnce(new Error('disk'));

    await expect(forgetDevice('p1')).rejects.toMatchObject({
      name: 'DeviceDeleteError',
    });
    expect(removePeerState).not.toHaveBeenCalled();

    removePeerState.mockRejectedValueOnce(new Error('disk'));

    await expect(forgetDevice('p1')).rejects.toMatchObject({
      name: 'DeviceDeleteError',
    });
  });
});

describe('handlePeerMessage', () => {
  const envelope = (value: object) => JSON.stringify(value);

  it.each([
    ['a frame that is no JSON', 'not json'],
    [
      'an envelope of an unknown type',
      envelope({ v: 1, type: 'wave', payload: {} }),
    ],
    ['an envelope without a payload', envelope({ v: 1, type: 'hello' })],
    [
      'a hello with a number as its name',
      envelope({ v: 1, type: 'hello', payload: { name: 4 } }),
    ],
  ])('ignores %s, touching nothing', async (_name, raw) => {
    const { handlePeerMessage } = await import('../devicesService');

    await expect(handlePeerMessage('p1', raw)).resolves.toBe('ignored');

    expect(getPaired).not.toHaveBeenCalled();
    expect(updatePaired).not.toHaveBeenCalled();
    expect(removePaired).not.toHaveBeenCalled();
    expect(invoke).not.toHaveBeenCalled();
  });

  it('forgets the sender on an unpair envelope: distrusts it, removes the device and its sync state', async () => {
    const { handlePeerMessage } = await import('../devicesService');

    await expect(
      handlePeerMessage('p1', JSON.stringify(buildUnpairEnvelope())),
    ).resolves.toBe('devices-changed');

    expect(invoke).toHaveBeenCalledWith('remove_trusted_peer', {
      endpointId: 'p1',
    });
    expect(removePaired).toHaveBeenCalledWith('p1');
    expect(removePeerState).toHaveBeenCalledWith('p1');
    expect(invoke.mock.invocationCallOrder[0]).toBeLessThan(
      removePaired.mock.invocationCallOrder[0],
    );
    expect(removePaired.mock.invocationCallOrder[0]).toBeLessThan(
      removePeerState.mock.invocationCallOrder[0],
    );
  });

  it.each([
    ['a hello', buildHelloEnvelope('New name')],
    ['a name update', buildNameUpdateEnvelope('New name')],
  ])(
    'stores the name of %s on the paired device when it differs',
    async (_name, message) => {
      const { handlePeerMessage } = await import('../devicesService');
      getPaired.mockResolvedValue(
        buildPairedDevice({ id: 'p1', name: 'Old name' }),
      );

      await expect(
        handlePeerMessage('p1', JSON.stringify(message)),
      ).resolves.toBe('devices-changed');

      expect(updatePaired).toHaveBeenCalledWith('p1', { name: 'New name' });
    },
  );

  it('ignores a name equal to the stored one, and a message from a device that is not paired, updating nothing', async () => {
    const { handlePeerMessage } = await import('../devicesService');
    getPaired.mockResolvedValue(buildPairedDevice({ id: 'p1', name: 'Same' }));

    await expect(
      handlePeerMessage('p1', JSON.stringify(buildHelloEnvelope('Same'))),
    ).resolves.toBe('ignored');

    getPaired.mockResolvedValue(null);

    await expect(
      handlePeerMessage('p1', JSON.stringify(buildHelloEnvelope('Other'))),
    ).resolves.toBe('ignored');
    expect(updatePaired).not.toHaveBeenCalled();
  });

  it('can set a name where the stored one is empty, and clear one with a null name', async () => {
    const { handlePeerMessage } = await import('../devicesService');
    getPaired.mockResolvedValue(buildPairedDevice({ id: 'p1', name: null }));

    await handlePeerMessage('p1', JSON.stringify(buildHelloEnvelope('Named')));

    expect(updatePaired).toHaveBeenLastCalledWith('p1', { name: 'Named' });

    getPaired.mockResolvedValue(buildPairedDevice({ id: 'p1', name: 'Named' }));
    await handlePeerMessage(
      'p1',
      JSON.stringify(buildNameUpdateEnvelope(null)),
    );

    expect(updatePaired).toHaveBeenLastCalledWith('p1', { name: null });
  });

  it('rejects as DeviceUpdateError when a step of the message fails', async () => {
    const { handlePeerMessage } = await import('../devicesService');
    getPaired.mockRejectedValueOnce(new Error('disk'));

    await expect(
      handlePeerMessage('p1', JSON.stringify(buildHelloEnvelope('Name'))),
    ).rejects.toMatchObject({ name: 'DeviceUpdateError' });

    getPaired.mockResolvedValue(buildPairedDevice({ id: 'p1', name: 'Old' }));
    updatePaired.mockRejectedValueOnce(new Error('disk'));

    await expect(
      handlePeerMessage('p1', JSON.stringify(buildHelloEnvelope('Name'))),
    ).rejects.toMatchObject({ name: 'DeviceUpdateError' });

    invoke.mockRejectedValueOnce(new Error('down'));

    await expect(
      handlePeerMessage('p1', JSON.stringify(buildUnpairEnvelope())),
    ).rejects.toMatchObject({ name: 'DeviceUpdateError' });
  });
});
