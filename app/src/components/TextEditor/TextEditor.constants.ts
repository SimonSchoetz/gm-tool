// Update tag marking an editor-state change that originated from an external (synced) value rather than local user input. handleChange skips updates carrying this tag, so applying a paired device's value is never re-emitted as a fresh local save that would echo back to that device.
export const EXTERNAL_SYNC_TAG = 'external-value-sync';
