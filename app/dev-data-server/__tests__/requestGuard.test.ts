// @vitest-environment node
import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import {
  isAllowedHost,
  isFixturePath,
  isJsonContentType,
  isSafeImageFileName,
  readJsonBody,
} from '../requestGuard';

describe('isAllowedHost', () => {
  it.each(['localhost', 'localhost:1420', '127.0.0.1:5173', '[::1]:1420'])(
    'accepts the loopback host %s',
    (host) => {
      expect(isAllowedHost(host)).toBe(true);
    },
  );

  it.each(['evil.example', 'localhost.evil.example:1420', 'localhost:'])(
    'rejects %s',
    (host) => {
      expect(isAllowedHost(host)).toBe(false);
    },
  );

  it('rejects a missing header', () => {
    expect(isAllowedHost()).toBe(false);
  });
});

describe('isJsonContentType', () => {
  it('accepts application/json with or without a charset and whatever the case', () => {
    expect(isJsonContentType('application/json')).toBe(true);
    expect(isJsonContentType('application/json; charset=utf-8')).toBe(true);
    expect(isJsonContentType('Application/JSON')).toBe(true);
  });

  it('rejects another media type and a missing header', () => {
    expect(isJsonContentType('text/plain')).toBe(false);
    expect(isJsonContentType()).toBe(false);
  });
});

describe('readJsonBody', () => {
  const bodyOf = (...chunks: string[]) =>
    Readable.from(chunks.map((chunk) => Buffer.from(chunk)));

  it('parses a body exactly at the cap, delivered in several chunks', async () => {
    await expect(readJsonBody(bodyOf('{"a":', '1}'), 7)).resolves.toEqual({
      ok: true,
      body: { a: 1 },
    });
  });

  it('answers 413 for a body one byte over the cap', async () => {
    await expect(readJsonBody(bodyOf('{"a":', '12}'), 7)).resolves.toEqual({
      ok: false,
      status: 413,
    });
  });

  it('answers 400 for a body that is not JSON', async () => {
    await expect(readJsonBody(bodyOf('{"a":'), 64)).resolves.toEqual({
      ok: false,
      status: 400,
    });
  });
});

describe('isSafeImageFileName', () => {
  it.each(['abc_-1.png', 'AbC', 'a.jpeg', 'b.webp'])('accepts %s', (name) => {
    expect(isSafeImageFileName(name)).toBe(true);
  });

  it.each(['../x.png', 'a.svg', 'a/b.png', 'a.png.exe', '', '.png'])(
    'rejects %s',
    (name) => {
      expect(isSafeImageFileName(name)).toBe(false);
    },
  );
});

describe('isFixturePath', () => {
  const fixtures = ['/fixtures/a.png', '/fixtures/b.jpg'];

  it('accepts exactly a listed path and rejects a sibling, a prefix and a non-string', () => {
    expect(isFixturePath('/fixtures/b.jpg', fixtures)).toBe(true);
    expect(isFixturePath('/fixtures/c.png', fixtures)).toBe(false);
    expect(isFixturePath('/fixtures', fixtures)).toBe(false);
    expect(isFixturePath(['/fixtures/a.png'], fixtures)).toBe(false);
  });
});
