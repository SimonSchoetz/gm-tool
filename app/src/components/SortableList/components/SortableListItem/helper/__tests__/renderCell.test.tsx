import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { renderCell } from '../renderCell';

vi.mock('../../components', () => ({
  AvatarCell: ({ imageId }: { imageId: string | null | undefined }) => (
    <div data-testid='avatar-cell' data-image-id={imageId ?? ''} />
  ),
}));

describe('renderCell', () => {
  describe('image_id key', () => {
    it('renders AvatarCell with the provided imageId', () => {
      const node = renderCell('image_id', { image_id: 'img-123' });
      const { getByTestId } = render(<>{node}</>);
      expect(getByTestId('avatar-cell')).toBeInTheDocument();
      expect(getByTestId('avatar-cell')).toHaveAttribute('data-image-id', 'img-123');
    });

    it('renders AvatarCell with empty data-image-id when image_id is absent', () => {
      const node = renderCell('image_id', {});
      const { getByTestId } = render(<>{node}</>);
      expect(getByTestId('avatar-cell')).toHaveAttribute('data-image-id', '');
    });
  });

  describe('date keys', () => {
    it('returns a formatted date string for created_at', () => {
      const result = renderCell('created_at', { created_at: '2024-03-15T10:30:00' });
      expect(typeof result).toBe('string');
      expect(result as string).toContain('2024');
    });

    it('returns a formatted date string for updated_at', () => {
      const result = renderCell('updated_at', { updated_at: '2024-06-01T00:00:00' });
      expect(typeof result).toBe('string');
      expect(result as string).toContain('2024');
    });

    it('returns empty string when a date key value is null', () => {
      expect(renderCell('created_at', { created_at: null })).toBe('');
    });

    it('returns empty string when a date key value is undefined', () => {
      expect(renderCell('updated_at', {})).toBe('');
    });
  });

  describe('default key', () => {
    it('stringifies a string value', () => {
      expect(renderCell('name', { name: 'Elara' })).toBe('Elara');
    });

    it('stringifies a numeric value', () => {
      expect(renderCell('level', { level: 5 })).toBe('5');
    });

    it('returns empty string for a missing key', () => {
      expect(renderCell('name', {})).toBe('');
    });
  });
});
