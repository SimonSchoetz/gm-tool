import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    it('should render loading state initially', () => {
      (adventure.getAll as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      );

      render(<App />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should initialize database and load adventures on mount', async () => {
      (adventure.getAll as ReturnType<typeof vi.fn>).mockResolvedValue(mockPaginatedResponse);

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

  describe('Adventure Display', () => {
    it('should display empty state with create button when no adventures exist', async () => {
      (adventure.getAll as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Create Adventure')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
      });
    });
  });

  describe('Create Adventure', () => {
    it('should show form when create button is clicked', async () => {
      const user = userEvent.setup();

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Create Adventure')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Adventure Title *')).toBeInTheDocument();
      });
    });

    it('should create new adventure with form data', async () => {
      const user = userEvent.setup();
      (adventure.create as ReturnType<typeof vi.fn>).mockResolvedValue('new-test-id');

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Create Adventure')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Adventure Title *')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Adventure Title *');
      const descriptionInput = screen.getByPlaceholderText('Description');
      const submitButton = screen.getByRole('button', { name: 'Create Adventure' });

      await user.type(titleInput, 'New Adventure');
      await user.type(descriptionInput, 'New Description');
      await user.click(submitButton);

      await waitFor(() => {
        expect(adventure.create).toHaveBeenCalledWith({
          title: 'New Adventure',
          description: 'New Description',
        });
      });
    });

    it('should hide form when cancel is clicked', async () => {
      const user = userEvent.setup();

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Create Adventure')).toBeInTheDocument();
      });

      const createButton = screen.getByRole('button');
      await user.click(createButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Adventure Title *')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText('Adventure Title *')).not.toBeInTheDocument();
        expect(screen.getByText('Create Adventure')).toBeInTheDocument();
      });
    });
  });
});
