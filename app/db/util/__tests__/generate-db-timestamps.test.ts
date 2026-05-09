import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateDbTimestamps } from '../generate-db-timestamps';

describe('generateDbTimestamps', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return created_at, updated_at, and now all equal to the current ISO timestamp', () => {
    const result = generateDbTimestamps();

    expect(result.created_at).toBe('2024-01-15T10:30:00.000Z');
    expect(result.updated_at).toBe('2024-01-15T10:30:00.000Z');
    expect(result.now).toBe('2024-01-15T10:30:00.000Z');
  });

  it('should return all three fields with the same value', () => {
    const { created_at, updated_at, now } = generateDbTimestamps();

    expect(created_at).toBe(now);
    expect(updated_at).toBe(now);
  });
});
