import { describe, it, expect } from 'vitest';
import { generateId } from '../generate-id';

describe('generateId', () => {
  it('should generate a string ID', () => {
    const id = generateId();

    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    const id3 = generateId();

    expect(id1).not.toBe(id2);
    expect(id1).not.toBe(id3);
    expect(id2).not.toBe(id3);
  });

  it('should generate IDs with default nanoid length (21 characters)', () => {
    const id = generateId();

    expect(id.length).toBe(21);
  });

  it('should generate IDs that are URL-safe', () => {
    const id = generateId();

    // nanoid uses A-Za-z0-9_- characters
    const urlSafePattern = /^[A-Za-z0-9_-]+$/;
    expect(id).toMatch(urlSafePattern);
  });

  it('should consistently generate IDs of the same length', () => {
    const ids = Array.from({ length: 100 }, () => generateId());
    const allSameLength = ids.every(id => id.length === 21);

    expect(allSameLength).toBe(true);
  });
});
