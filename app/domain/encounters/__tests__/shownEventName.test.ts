import { describe, expect, it } from 'vitest';
import { shownEventName, UNNAMED_EVENT_LABEL } from '../shownEventName';

describe('shownEventName', () => {
  it('shows the name trimmed', () => {
    expect(shownEventName('  Lair action ')).toBe('Lair action');
  });

  it.each([
    ['null', null],
    ['empty', ''],
    ['spaces-only', '   '],
  ])('shows the fallback for a %s name', (_label, name) => {
    expect(shownEventName(name)).toBe(UNNAMED_EVENT_LABEL);
  });

  it('words the fallback as the label the GM sees for an unnamed event', () => {
    expect(UNNAMED_EVENT_LABEL).toBe('Untitled Event');
  });
});
