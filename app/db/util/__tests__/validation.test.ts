import { describe, it, expect } from 'vitest';
import { assertValidId, assertHasUpdateFields } from '../validation';

describe('assertValidId', () => {
  it('should throw with entity name in message when id is empty string', () => {
    expect(() => assertValidId('', 'Adventure')).toThrow(
      'Valid Adventure ID is required',
    );
  });

  it('should throw when id is whitespace only', () => {
    expect(() => assertValidId('   ', 'Session')).toThrow(
      'Valid Session ID is required',
    );
  });

  it('should not throw when id is a valid non-empty string', () => {
    expect(() => assertValidId('test-id', 'NPC')).not.toThrow();
  });
});

describe('assertHasUpdateFields', () => {
  it('should throw when data object is empty', () => {
    expect(() => assertHasUpdateFields({})).toThrow(
      'At least one field must be provided for update',
    );
  });

  it('should throw when all values are undefined', () => {
    expect(() =>
      assertHasUpdateFields({ name: undefined, description: undefined }),
    ).toThrow('At least one field must be provided for update');
  });

  it('should not throw when at least one value is defined', () => {
    expect(() => assertHasUpdateFields({ name: 'New Name' })).not.toThrow();
  });

  it('should not throw when multiple values are defined', () => {
    expect(() =>
      assertHasUpdateFields({ name: 'New Name', description: 'New Desc' }),
    ).not.toThrow();
  });
});
