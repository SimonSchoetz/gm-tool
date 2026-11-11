import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { formatDateValue } from '../formatDateValue';
import { renderCell } from '../renderCell';

vi.mock('../../components/CoverCell/CoverCell', () => ({
  CoverCell: ({
    imageId,
    entityType,
  }: {
    imageId: string | null | undefined;
    entityType: string | null;
  }) => (
    <div
      data-testid='cover-cell'
      data-image-id={imageId ?? ''}
      data-entity-type={entityType ?? ''}
    />
  ),
}));

describe('renderCell', () => {
  describe('image_id key', () => {
    it('renders CoverCell with the provided imageId', () => {
      const node = renderCell('image_id', { image_id: 'img-123' }, null);
      const { getByTestId } = render(<>{node}</>);
      expect(getByTestId('cover-cell')).toBeInTheDocument();
      expect(getByTestId('cover-cell')).toHaveAttribute(
        'data-image-id',
        'img-123',
      );
    });

    it('renders CoverCell with empty data-image-id when image_id is absent', () => {
      const node = renderCell('image_id', {}, null);
      const { getByTestId } = render(<>{node}</>);
      expect(getByTestId('cover-cell')).toHaveAttribute('data-image-id', '');
    });

    it('hands the entity type to CoverCell, and null when there is none', () => {
      const withType = render(
        <>{renderCell('image_id', { image_id: 'img-123' }, 'locations')}</>,
      );
      expect(withType.getByTestId('cover-cell')).toHaveAttribute(
        'data-entity-type',
        'locations',
      );
      withType.unmount();

      const withoutType = render(
        <>{renderCell('image_id', { image_id: 'img-123' }, null)}</>,
      );
      expect(withoutType.getByTestId('cover-cell')).toHaveAttribute(
        'data-entity-type',
        '',
      );
    });
  });

  describe('date keys', () => {
    it('returns a formatted date string for created_at', () => {
      const result = renderCell(
        'created_at',
        { created_at: '2024-03-15T10:30:00' },
        null,
      );
      expect(typeof result).toBe('string');
      expect(result as string).toContain('2024');
    });

    it('returns a formatted date string for updated_at', () => {
      const result = renderCell(
        'updated_at',
        { updated_at: '2024-06-01T00:00:00' },
        null,
      );
      expect(typeof result).toBe('string');
      expect(result as string).toContain('2024');
    });

    it('returns empty string when a date key value is null', () => {
      expect(renderCell('created_at', { created_at: null }, null)).toBe('');
    });

    it('returns empty string when a date key value is undefined', () => {
      expect(renderCell('updated_at', {}, null)).toBe('');
    });
  });

  describe('default key', () => {
    it('stringifies a string value', () => {
      expect(renderCell('name', { name: 'Elara' }, null)).toBe('Elara');
    });

    it('stringifies a numeric value', () => {
      expect(renderCell('level', { level: 5 }, null)).toBe('5');
    });

    it('returns empty string for a missing key', () => {
      expect(renderCell('name', {}, null)).toBe('');
    });
  });

  describe('date keys against the raw value', () => {
    it.each(['created_at', 'updated_at'])(
      'shows %s through formatDateValue, not as the stored text',
      (key) => {
        const stored = '2024-03-15T10:30:00';

        const result = renderCell(key, { [key]: stored }, null);

        expect(result).toBe(formatDateValue(stored));
        expect(result).not.toBe(stored);
      },
    );
  });

  describe('default key with values that are not text', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
    ])('returns an empty string for a %s value', (_name, value) => {
      expect(renderCell('notes', { notes: value }, null)).toBe('');
    });

    it('writes an object or an array value as JSON', () => {
      expect(renderCell('layout', { layout: { a: 1 } }, null)).toBe('{"a":1}');
      expect(renderCell('tags', { tags: ['x', 'y'] }, null)).toBe('["x","y"]');
    });
  });
});
