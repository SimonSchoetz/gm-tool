import { describe, it, expect, vi, beforeEach } from 'vitest';
import { filePicker } from '../filePicker';

// Mock the Tauri dialog module
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: vi.fn(),
}));

import { open } from '@tauri-apps/plugin-dialog';

describe('filePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('successful file selection', () => {
    it('should return selected file path for image type', async () => {
      const mockPath = '/path/to/image.jpg';
      vi.mocked(open).mockResolvedValue(mockPath);

      const result = await filePicker('image');

      expect(result).toBe(mockPath);
      expect(open).toHaveBeenCalledWith({
        multiple: false,
        filters: [
          {
            name: 'Allowed Files',
            extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
          },
        ],
      });
    });

    it('should return selected file path for document type', async () => {
      const mockPath = '/path/to/document.pdf';
      vi.mocked(open).mockResolvedValue(mockPath);

      const result = await filePicker('document');

      expect(result).toBe(mockPath);
      expect(open).toHaveBeenCalledWith({
        multiple: false,
        filters: [
          {
            name: 'Allowed Files',
            extensions: ['pdf', 'md'],
          },
        ],
      });
    });

    it('should return null when user cancels selection', async () => {
      vi.mocked(open).mockResolvedValue(null);

      const result = await filePicker('image');

      expect(result).toBe(null);
    });
  });

  describe('file type filters', () => {
    it('should use correct extensions for image type', async () => {
      vi.mocked(open).mockResolvedValue('/path/to/file.png');

      await filePicker('image');

      expect(open).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: [
            {
              name: 'Allowed Files',
              extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
            },
          ],
        })
      );
    });

    it('should use correct extensions for document type', async () => {
      vi.mocked(open).mockResolvedValue('/path/to/file.pdf');

      await filePicker('document');

      expect(open).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: [
            {
              name: 'Allowed Files',
              extensions: ['pdf', 'md'],
            },
          ],
        })
      );
    });

    it('should always set multiple to false', async () => {
      vi.mocked(open).mockResolvedValue('/path/to/file.jpg');

      await filePicker('image');

      expect(open).toHaveBeenCalledWith(
        expect.objectContaining({
          multiple: false,
        })
      );
    });
  });

  describe('error handling', () => {
    it('should throw Error when open() throws an Error', async () => {
      const errorMessage = 'Failed to open dialog';
      vi.mocked(open).mockRejectedValue(new Error(errorMessage));

      await expect(filePicker('image')).rejects.toThrow(errorMessage);
    });

    it('should throw Error when open() throws a string', async () => {
      const errorMessage = 'String error message';
      vi.mocked(open).mockRejectedValue(errorMessage);

      await expect(filePicker('image')).rejects.toThrow(errorMessage);
    });

    it('should throw Error with formatted message for unknown error types', async () => {
      const unknownError = { code: 500, message: 'Unknown' };
      vi.mocked(open).mockRejectedValue(unknownError);

      await expect(filePicker('image')).rejects.toThrow(
        `Failed to open file picker: ${unknownError}`
      );
    });

    it('should throw Error when open() throws null', async () => {
      vi.mocked(open).mockRejectedValue(null);

      await expect(filePicker('image')).rejects.toThrow(
        'Failed to open file picker: null'
      );
    });

    it('should throw Error when open() throws undefined', async () => {
      vi.mocked(open).mockRejectedValue(undefined);

      await expect(filePicker('image')).rejects.toThrow(
        'Failed to open file picker: undefined'
      );
    });

    it('should throw Error when open() throws a number', async () => {
      vi.mocked(open).mockRejectedValue(404);

      await expect(filePicker('image')).rejects.toThrow(
        'Failed to open file picker: 404'
      );
    });
  });

  describe('return value types', () => {
    it('should return string when file is selected', async () => {
      const mockPath = '/path/to/file.jpg';
      vi.mocked(open).mockResolvedValue(mockPath);

      const result = await filePicker('image');

      expect(typeof result).toBe('string');
    });

    it('should return null when no file is selected', async () => {
      vi.mocked(open).mockResolvedValue(null);

      const result = await filePicker('image');

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string path', async () => {
      vi.mocked(open).mockResolvedValue('');

      const result = await filePicker('image');

      expect(result).toBe('');
    });

    it('should handle paths with special characters', async () => {
      const specialPath = '/path/to/my file (1) [test].jpg';
      vi.mocked(open).mockResolvedValue(specialPath);

      const result = await filePicker('image');

      expect(result).toBe(specialPath);
    });

    it('should handle Windows-style paths', async () => {
      const windowsPath = 'C:\\Users\\test\\Documents\\file.jpg';
      vi.mocked(open).mockResolvedValue(windowsPath);

      const result = await filePicker('image');

      expect(result).toBe(windowsPath);
    });

    it('should handle network paths', async () => {
      const networkPath = '\\\\server\\share\\file.jpg';
      vi.mocked(open).mockResolvedValue(networkPath);

      const result = await filePicker('image');

      expect(result).toBe(networkPath);
    });
  });
});
