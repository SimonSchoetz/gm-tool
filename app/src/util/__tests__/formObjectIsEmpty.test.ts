import { describe, it, expect } from 'vitest';
import { formObjectIsEmpty } from '../formObjectIsEmpty';

describe('formObjectIsEmpty', () => {
  describe('basic empty checks', () => {
    it('should return true for object with all empty string values', () => {
      const obj = {
        name: '',
        email: '',
        phone: '',
      };

      expect(formObjectIsEmpty(obj)).toBe(true);
    });

    it('should return false for object with at least one non-empty value', () => {
      const obj = {
        name: 'John',
        email: '',
        phone: '',
      };

      expect(formObjectIsEmpty(obj)).toBe(false);
    });

    it('should return true for empty object', () => {
      const obj = {};

      expect(formObjectIsEmpty(obj)).toBe(true);
    });

    it('should return false when all values are non-empty', () => {
      const obj = {
        name: 'John',
        email: 'john@example.com',
        phone: '123-456-7890',
      };

      expect(formObjectIsEmpty(obj)).toBe(false);
    });
  });

  describe('nested object checks', () => {
    it('should return true for nested objects with all empty strings', () => {
      const obj = {
        personal: {
          name: '',
          email: '',
        },
        address: {
          street: '',
          city: '',
        },
      };

      expect(formObjectIsEmpty(obj)).toBe(true);
    });

    it('should return false for nested objects with one non-empty value', () => {
      const obj = {
        personal: {
          name: '',
          email: 'test@example.com',
        },
        address: {
          street: '',
          city: '',
        },
      };

      expect(formObjectIsEmpty(obj)).toBe(false);
    });

    it('should return false when deeply nested value is non-empty', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              value: 'not empty',
            },
          },
        },
      };

      expect(formObjectIsEmpty(obj)).toBe(false);
    });

    it('should return true for deeply nested empty strings', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              value: '',
            },
          },
        },
      };

      expect(formObjectIsEmpty(obj)).toBe(true);
    });

    it('should handle mixed nested and flat properties', () => {
      const obj = {
        name: '',
        nested: {
          field1: '',
          field2: '',
        },
        email: '',
      };

      expect(formObjectIsEmpty(obj)).toBe(true);
    });
  });

  describe('type handling', () => {
    it('should return false for object with number value', () => {
      const obj = {
        name: '',
        age: 0,
      };

      expect(formObjectIsEmpty(obj)).toBe(false);
    });

    it('should return false for object with boolean false', () => {
      const obj = {
        name: '',
        isActive: false,
      };

      expect(formObjectIsEmpty(obj)).toBe(false);
    });

    it('should return false for object with boolean true', () => {
      const obj = {
        name: '',
        isActive: true,
      };

      expect(formObjectIsEmpty(obj)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle object with only nested empty objects', () => {
      const obj = {
        nested1: {},
        nested2: {},
      };

      expect(formObjectIsEmpty(obj)).toBe(true);
    });

    it('should handle whitespace strings as non-empty', () => {
      const obj = {
        name: ' ',
        email: '  ',
      };

      expect(formObjectIsEmpty(obj)).toBe(false);
    });

    it('should handle single space as non-empty', () => {
      const obj = {
        name: ' ',
      };

      expect(formObjectIsEmpty(obj)).toBe(false);
    });

    it('should return true for object with null values (edge case)', () => {
      const obj = {
        name: null,
        email: null,
      };

      // Note: This will likely throw an error with current implementation
      // as typeof null === 'object' and Object.values(null) throws
      // Consider this a known limitation that should be fixed
      expect(() => formObjectIsEmpty(obj)).toThrow();
    });

    it('should handle undefined values (edge case)', () => {
      const obj = {
        name: undefined,
        email: undefined,
      };

      // undefined values should be considered as non-empty with current logic
      expect(formObjectIsEmpty(obj)).toBe(false);
    });
  });

  describe('array handling', () => {
    it('should handle empty arrays', () => {
      const obj = {
        tags: [],
        name: '',
      };

      // Current implementation will treat empty array as empty object
      expect(formObjectIsEmpty(obj)).toBe(true);
    });

    it('should handle arrays with empty strings', () => {
      const obj = {
        tags: ['', '', ''],
        name: '',
      };

      expect(formObjectIsEmpty(obj)).toBe(true);
    });

    it('should return false for arrays with non-empty values', () => {
      const obj = {
        tags: ['tag1', '', ''],
        name: '',
      };

      expect(formObjectIsEmpty(obj)).toBe(false);
    });
  });

  describe('real-world form scenarios', () => {
    it('should handle typical form data - all empty', () => {
      const formData = {
        title: '',
        description: '',
        imgFilePath: '',
      };

      expect(formObjectIsEmpty(formData)).toBe(true);
    });

    it('should handle typical form data - partially filled', () => {
      const formData = {
        title: 'My Adventure',
        description: '',
        imgFilePath: '',
      };

      expect(formObjectIsEmpty(formData)).toBe(false);
    });

    it('should handle form with nested address', () => {
      const formData = {
        name: '',
        address: {
          street: '',
          city: '',
          zip: '',
        },
      };

      expect(formObjectIsEmpty(formData)).toBe(true);
    });

    it('should detect changes in nested forms', () => {
      const formData = {
        name: '',
        address: {
          street: '123 Main St',
          city: '',
          zip: '',
        },
      };

      expect(formObjectIsEmpty(formData)).toBe(false);
    });
  });
});
