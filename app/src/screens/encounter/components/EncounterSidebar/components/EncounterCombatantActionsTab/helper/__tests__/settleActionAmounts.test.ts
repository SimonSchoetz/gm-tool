import { describe, expect, it } from 'vitest';
import { settleActionAmounts } from '../settleActionAmounts';

describe('settleActionAmounts', () => {
  it('returns the same object when nothing changes', () => {
    const state = { sharedText: '5', rowTexts: { a: '7', b: '9' } };

    expect(settleActionAmounts(state, ['a', 'b'])).toBe(state);
  });

  it('returns the same object for a single selection with no row text', () => {
    const state = { sharedText: '5', rowTexts: {} };

    expect(settleActionAmounts(state, ['a'])).toBe(state);
  });

  it('drops the row text of an id that left the selection and keeps the shared text', () => {
    const result = settleActionAmounts(
      { sharedText: '5', rowTexts: { a: '7', b: '9' } },
      ['a', 'c'],
    );

    expect(result).toEqual({ sharedText: '5', rowTexts: { a: '7' } });
  });

  it('drops every row text and keeps the shared text when nothing is selected', () => {
    const result = settleActionAmounts(
      { sharedText: '5', rowTexts: { a: '7' } },
      [],
    );

    expect(result).toEqual({ sharedText: '5', rowTexts: {} });
  });

  it('folds the row text of the only selected id into the shared text and empties the row texts', () => {
    const result = settleActionAmounts(
      { sharedText: '5', rowTexts: { a: '7', b: '9' } },
      ['a'],
    );

    expect(result).toEqual({ sharedText: '7', rowTexts: {} });
  });

  it('keeps the shared text when the only selected id has no row text of its own', () => {
    const result = settleActionAmounts(
      { sharedText: '5', rowTexts: { b: '9' } },
      ['a'],
    );

    expect(result).toEqual({ sharedText: '5', rowTexts: {} });
  });

  it('keeps the row texts of the selected ids while two or more are selected', () => {
    const result = settleActionAmounts(
      { sharedText: '5', rowTexts: { a: '7', b: '9', c: '1' } },
      ['a', 'b'],
    );

    expect(result).toEqual({ sharedText: '5', rowTexts: { a: '7', b: '9' } });
  });
});
