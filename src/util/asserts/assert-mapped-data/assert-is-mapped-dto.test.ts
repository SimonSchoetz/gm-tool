import { MappedPrototype, assertIsMappedDto } from './assert-is-mapped-dto';

type TestObject = {
  name: string;
  description?: string;
  aNumber: number;
};

const prototype: MappedPrototype<TestObject> = {
  name: { required: true, type: 'string' },
  description: { required: false, type: 'string' },
  aNumber: { required: true, type: 'number' },
};

const getAssertIsMappedDto = (testData: any) => {
  return assertIsMappedDto<TestObject>(testData, prototype);
};

describe('assertIsMappedDto', () => {
  it('should throw an error if required keys are missing', () => {
    const mappedData = {
      description: 'optional',
    };

    expect(() => getAssertIsMappedDto(mappedData)).toThrow(
      'Required Keys are missing: name'
    );
  });

  it('should throw an error if there are unknown keys', () => {
    const mappedData = {
      name: 'name',
      test: 'test',
      aNumber: 1,
    };

    expect(() => getAssertIsMappedDto(mappedData)).toThrow(
      'Unknown keys: test'
    );
  });

  it('should throw an error if value is not of expected type', () => {
    const mappedData = {
      name: 1,
      aNumber: 1,
    };

    expect(() => getAssertIsMappedDto(mappedData)).toThrow(
      `Value of 'name' is not of type string. Got: number`
    );
  });
});
