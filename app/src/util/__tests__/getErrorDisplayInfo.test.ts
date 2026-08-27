import { describe, it, expect } from 'vitest';
import { getErrorDisplayInfo } from '../getErrorDisplayInfo';

describe('getErrorDisplayInfo', () => {
  it('extracts message and stack from an Error instance', () => {
    const error = new Error('boom');
    const info = getErrorDisplayInfo(error);
    expect(info.message).toBe('boom');
    expect(info.stack).toBe(error.stack);
  });

  it('falls back to null stack when an Error has no stack', () => {
    const error = new Error('boom');
    delete error.stack;
    const info = getErrorDisplayInfo(error);
    expect(info).toEqual({ message: 'boom', stack: null });
  });

  it('stringifies a plain string rejection with a null stack', () => {
    expect(getErrorDisplayInfo('raw ipc failure')).toEqual({
      message: 'raw ipc failure',
      stack: null,
    });
  });

  it('stringifies a non-Error, non-string value', () => {
    expect(getErrorDisplayInfo({ code: 1 })).toEqual({
      message: '[object Object]',
      stack: null,
    });
  });
});
