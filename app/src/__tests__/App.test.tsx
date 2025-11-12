import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';
import * as database from '@db/database';
import * as adventure from '@db/adventure';

vi.mock('@db/database', () => ({
  initDatabase: vi.fn(),
  getDatabase: vi.fn(),
}));

vi.mock('@db/adventure', () => ({
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

describe('App Component', () => {
  const mockAdventures = [
    {
      id: 'test-id-1',
      title: 'First Adventure',
      description: 'First description',
      created_at: '2025-10-13T10:00:00Z',
      updated_at: '2025-10-13T10:00:00Z',
    },
    {
      id: 'test-id-2',
      title: 'Second Adventure',
      description: 'Second description',
      created_at: '2025-10-12T10:00:00Z',
      updated_at: '2025-10-12T10:00:00Z',
    },
  ];

  const mockPaginatedResponse = {
    data: mockAdventures,
    total: 2,
    limit: 20,
    offset: 0,
    hasMore: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (database.initDatabase as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (adventure.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: [],
      total: 0,
      limit: 20,
      offset: 0,
      hasMore: false,
    });
  });

  describe('Initialization', () => {
    it('should initialize database and load adventures on mount', async () => {
      (adventure.getAll as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockPaginatedResponse
      );

      render(<App />);

      await waitFor(() => {
        expect(database.initDatabase).toHaveBeenCalledOnce();
        expect(adventure.getAll).toHaveBeenCalledOnce();
      });
    });

    it('should display error message when database initialization fails', async () => {
      const errorMessage = 'Database connection failed';
      (database.initDatabase as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error(errorMessage)
      );

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText(/Database error:/)).toBeInTheDocument();
      });
    });
  });
});
