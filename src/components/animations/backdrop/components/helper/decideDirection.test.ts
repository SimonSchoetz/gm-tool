import { decideDirection } from './decideDirection';

describe('decideDirection', () => {
  it('should go down when last direction is null', () => {
    expect(decideDirection(null, 5, 3)).toBe('down');
  });
  it('should go down when last direction was left and current col is 0', () => {
    expect(decideDirection('left', 5, 0)).toBe('down');
  });
  it('should go down when last direction was right and current col is maxCol', () => {
    expect(decideDirection('right', 5, 5)).toBe('down');
  });
  it('should not go left when last direction was down and current col is 0', () => {
    expect(decideDirection('down', 5, 0)).not.toBe('left');
  });
  it('should not go right when last direction was down and current col is maxCol', () => {
    expect(decideDirection('down', 5, 5)).not.toBe('right');
  });
  it('should not go left if last direction was right', () => {
    expect(decideDirection('right', 5, 5)).not.toBe('left');
    expect(decideDirection('right', 5, 0)).not.toBe('left');
    expect(decideDirection('right', 5, 2)).not.toBe('left');
  });
  it('should not go right if last direction was left', () => {
    expect(decideDirection('left', 5, 5)).not.toBe('right');
    expect(decideDirection('left', 5, 0)).not.toBe('right');
    expect(decideDirection('left', 5, 2)).not.toBe('right');
  });
});
