// Stands in for the Tauri commands a services test running against the real in-memory database reaches through `invoke` from `@tauri-apps/api/core`: each command the image and device flows send resolves as the native side would, and any other command rejects, so a flow that starts calling a new command fails its test instead of passing on a silent answer.
export const SAVED_IMAGE_FILE_SIZE = 1234;

export const answerHostCommand = (command: string): Promise<unknown> => {
  switch (command) {
    case 'save_image':
      return Promise.resolve(SAVED_IMAGE_FILE_SIZE);
    case 'read_image_bytes':
      return Promise.resolve('aW1hZ2U=');
    case 'save_image_bytes':
    case 'delete_image':
    case 'send_message':
    case 'remove_trusted_peer':
      return Promise.resolve(undefined);
    default:
      return Promise.reject(new Error(`Unexpected command: ${command}`));
  }
};
