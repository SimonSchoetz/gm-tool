import { describe, it, expect } from 'vitest';
import {
  buildHelloEnvelope,
  buildNameUpdateEnvelope,
  buildUnpairEnvelope,
  deviceMessageEnvelopeSchema,
} from '../messages';

describe('deviceMessageEnvelopeSchema', () => {
  it('accepts a built hello envelope', () => {
    const result = deviceMessageEnvelopeSchema.safeParse(
      buildHelloEnvelope('Laptop'),
    );
    expect(result.success).toBe(true);
  });

  it('accepts a built name-update envelope with null name', () => {
    const result = deviceMessageEnvelopeSchema.safeParse(
      buildNameUpdateEnvelope(null),
    );
    expect(result.success).toBe(true);
  });

  it('accepts a built unpair envelope', () => {
    const result = deviceMessageEnvelopeSchema.safeParse(buildUnpairEnvelope());
    expect(result.success).toBe(true);
  });

  it('rejects an unknown message type', () => {
    const result = deviceMessageEnvelopeSchema.safeParse({
      v: 1,
      type: 'sync-batch',
      payload: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects a hello without a name field in the payload', () => {
    const result = deviceMessageEnvelopeSchema.safeParse({
      v: 1,
      type: 'hello',
      payload: {},
    });
    expect(result.success).toBe(false);
  });

  it('round-trips through JSON', () => {
    const result = deviceMessageEnvelopeSchema.safeParse(
      JSON.parse(JSON.stringify(buildHelloEnvelope(null))),
    );
    expect(result.success).toBe(true);
  });
});
