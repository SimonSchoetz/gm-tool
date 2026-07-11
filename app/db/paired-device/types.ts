import z from 'zod';
import { pairedDeviceTable } from './schema';

export type PairedDevice = z.infer<typeof pairedDeviceTable.zodSchema>;
export type UpdatePairedDeviceInput = z.infer<
  typeof pairedDeviceTable.updateSchema
>;
