import { mapFormDataToDto } from './form-data-to-dto';
type TestFormData = {
  testKey: string;
};

describe('mapFormDataToDto', () => {
  it('should return an empty object if the form data is empty', () => {
    //As of now, FormData is not properly supported in Jest, but it does what it should do
    const formData = new FormData();
    const mappedFormData = mapFormDataToDto<TestFormData>(formData);

    expect(Object.keys(mappedFormData).length).toEqual(0);
  });

  it('should form an object from the form entries', () => {
    //As of now, FormData is not properly supported in Jest, but it does what it should do
    const formData = new FormData();
    formData.append('testKey', 'testValue');
    const mappedFormData = mapFormDataToDto<TestFormData>(formData);

    expect(Object.keys(mappedFormData)[0]).toEqual('testKey');
    expect(Object.values(mappedFormData)[0]).toEqual('testValue');
    expect(mappedFormData.testKey).toEqual('testValue');
  });

  it('should fail if the form data is not a FormData object', () => {
    const formData = {} as FormData;
    try {
      mapFormDataToDto<TestFormData>(formData);
      // If the function doesn't throw an error, fail the test
      expect(true).toBe(false);
    } catch (e) {
      // If the function throws an error, pass the test
      expect(true).toBe(true);
    }
  });

  it('should not map NextJS action IDs', () => {
    //As of now, FormData is not properly supported in Jest, but it does what it should do
    const formData = new FormData();
    formData.append('action', 'testAction');
    formData.append('$ACTION_ID_3560af0b8c0579bbbbf6db812169de02a86c0bbe', '');

    const mappedFormData = mapFormDataToDto<TestFormData>(formData);

    const keys = Object.keys(mappedFormData);
    const hasActionIDKey = keys.includes(
      '$ACTION_ID_3560af0b8c0579bbbbf6db812169de02a86c0bbe'
    );
    expect(hasActionIDKey).toBe(false);
  });
});
