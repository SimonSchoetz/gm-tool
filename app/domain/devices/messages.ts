import { z } from 'zod';

export const ENVELOPE_VERSION = 1;

const namePayloadSchema = z.object({ name: z.string().nullable() });

export const deviceMessageEnvelopeSchema = z.discriminatedUnion('type', [
  z.object({
    v: z.number(),
    type: z.literal('hello'),
    payload: namePayloadSchema,
  }),
  z.object({
    v: z.number(),
    type: z.literal('name-update'),
    payload: namePayloadSchema,
  }),
  z.object({ v: z.number(), type: z.literal('unpair'), payload: z.object({}) }),
]);

export type DeviceMessageEnvelope = z.infer<typeof deviceMessageEnvelopeSchema>;

export const buildHelloEnvelope = (
  name: string | null,
): DeviceMessageEnvelope => ({
  v: ENVELOPE_VERSION,
  type: 'hello',
  payload: { name },
});

export const buildNameUpdateEnvelope = (
  name: string | null,
): DeviceMessageEnvelope => ({
  v: ENVELOPE_VERSION,
  type: 'name-update',
  payload: { name },
});

export const buildUnpairEnvelope = (): DeviceMessageEnvelope => ({
  v: ENVELOPE_VERSION,
  type: 'unpair',
  payload: {},
});
