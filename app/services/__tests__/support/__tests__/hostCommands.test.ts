import { describe, it, expect } from 'vitest';
import { answerHostCommand, SAVED_IMAGE_FILE_SIZE } from '../hostCommands';

describe('answerHostCommand', () => {
  it('answers save_image with the saved file size and read_image_bytes with base64 bytes', async () => {
    expect(await answerHostCommand('save_image')).toBe(SAVED_IMAGE_FILE_SIZE);
    expect(await answerHostCommand('read_image_bytes')).toBe('aW1hZ2U=');
  });

  it.each([
    'save_image_bytes',
    'delete_image',
    'send_message',
    'remove_trusted_peer',
  ])('resolves %s with no value', async (command) => {
    expect(await answerHostCommand(command)).toBeUndefined();
  });

  it('rejects a command no flow under test sends, naming it', async () => {
    await expect(answerHostCommand('get_connected_peers')).rejects.toThrow(
      /^Unexpected command: get_connected_peers$/,
    );
  });
});
