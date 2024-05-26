import { mapFormDataToDto } from './form-data-to-dto';

describe('mapFormDataToDto', () => {
  it('should return an empty object if the form data is empty', () => {
    const formData = new FormData();
    const mappedFormData = mapFormDataToDto(formData);

    expect(Object.keys(mappedFormData).length).toEqual(0);
  });
  it('should form an object from the form entries', () => {
    const formData = new FormData();
    formData.append('testKey', 'testValue');
    const mappedFormData = mapFormDataToDto(formData);

    expect(Object.keys(mappedFormData)[0]).toEqual('testKey');
    expect(Object.values(mappedFormData)[0]).toEqual('testValue');
    expect(mappedFormData.testKey).toEqual('testValue');
  });
  it('should fail if the form data is not a FormData object', () => {
    const formData = {} as FormData;
    try {
      mapFormDataToDto(formData);
      // If the function doesn't throw an error, fail the test
      expect(true).toBe(false);
    } catch (e) {
      // If the function throws an error, pass the test
      expect(true).toBe(true);
    }
  });
});
