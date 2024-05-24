import { assertIsNewAdventureRequestData } from './assert-is-new-adventure-request-data';

describe('assertIsNewAdventureRequestData', () => {
  it('should throw an error if required keys are missing', () => {
    const mappedData = {
      description: 'optional',
    };

    expect(() => assertIsNewAdventureRequestData(mappedData)).toThrow(
      'Required Keys are missing: name'
    );
  });

  it('should throw an error if there are unknown keys', () => {
    const mappedData = {
      name: 'name',
      test: 'test',
    };

    expect(() => assertIsNewAdventureRequestData(mappedData)).toThrow(
      'Unknown keys: test'
    );
  });

  it('should throw an error if value is not of expected type', () => {
    const mappedData = {
      name: 1,
    };

    expect(() => assertIsNewAdventureRequestData(mappedData)).toThrow(
      `Value of 'name' is not of type string. Got: number`
    );
  });
});
