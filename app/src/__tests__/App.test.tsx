import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import * as database from '@db/database';

// Mock the database module
vi.mock('@db/database', () => ({
  initDatabase: vi.fn(),
  getAllSessions: vi.fn(),
  createSession: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
}));

// Mock window.confirm
const mockConfirm = vi.fn();
global.confirm = mockConfirm;

describe('App Component', () => {
  const mockSessions = [
    {
      id: 1,
      title: 'First Session',
      description: 'First description',
      session_date: '2025-10-13',
      notes: 'First notes',
      created_at: '2025-10-13T10:00:00Z',
    },
    {
      id: 2,
      title: 'Second Session',
      description: 'Second description',
      session_date: '2025-10-12',
      notes: 'Second notes',
      created_at: '2025-10-12T10:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
    (database.initDatabase as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (database.getAllSessions as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  });

  describe('Initialization', () => {
    it('should render loading state initially', () => {
      (database.getAllSessions as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<App />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should initialize database and load sessions on mount', async () => {
      (database.getAllSessions as ReturnType<typeof vi.fn>).mockResolvedValue(mockSessions);

      render(<App />);

      await waitFor(() => {
        expect(database.initDatabase).toHaveBeenCalledOnce();
        expect(database.getAllSessions).toHaveBeenCalledOnce();
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

  describe('Session List Display', () => {
    it('should display sessions after loading', async () => {
      (database.getAllSessions as ReturnType<typeof vi.fn>).mockResolvedValue(mockSessions);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('First Session')).toBeInTheDocument();
        expect(screen.getByText('Second Session')).toBeInTheDocument();
      });
    });

    it('should display empty state when no sessions exist', async () => {
      (database.getAllSessions as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('No sessions yet. Create your first session above!')).toBeInTheDocument();
      });
    });

    it('should display session count', async () => {
      (database.getAllSessions as ReturnType<typeof vi.fn>).mockResolvedValue(mockSessions);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Sessions (2)')).toBeInTheDocument();
      });
    });
  });

  describe('Create Session', () => {
    it('should create new session with form data', async () => {
      const user = userEvent.setup();
      (database.getAllSessions as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (database.createSession as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Session Title *')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Session Title *');
      const descriptionInput = screen.getByPlaceholderText('Description');
      const notesInput = screen.getByPlaceholderText('Session Notes');
      const submitButton = screen.getByText('Create Session');

      await user.type(titleInput, 'New Session');
      await user.type(descriptionInput, 'New Description');
      await user.type(notesInput, 'New Notes');
      await user.click(submitButton);

      await waitFor(() => {
        expect(database.createSession).toHaveBeenCalledWith({
          title: 'New Session',
          description: 'New Description',
          session_date: '',
          notes: 'New Notes',
        });
      });
    });

    it('should clear form after successful creation', async () => {
      const user = userEvent.setup();
      (database.getAllSessions as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (database.createSession as ReturnType<typeof vi.fn>).mockResolvedValue(1);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Session Title *')).toBeInTheDocument();
      });

      const titleInput = screen.getByPlaceholderText('Session Title *') as HTMLInputElement;
      const submitButton = screen.getByText('Create Session');

      await user.type(titleInput, 'Test');
      await user.click(submitButton);

      await waitFor(() => {
        expect(titleInput.value).toBe('');
      });
    });
  });

  describe('Update Session', () => {
    it('should populate form when edit button is clicked', async () => {
      const user = userEvent.setup();
      (database.getAllSessions as ReturnType<typeof vi.fn>).mockResolvedValue(mockSessions);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('First Session')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      const titleInput = screen.getByPlaceholderText('Session Title *') as HTMLInputElement;
      const descriptionInput = screen.getByPlaceholderText('Description') as HTMLInputElement;

      expect(titleInput.value).toBe('First Session');
      expect(descriptionInput.value).toBe('First description');
      expect(screen.getByText('Update Session')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should update session with modified data', async () => {
      const user = userEvent.setup();
      (database.getAllSessions as ReturnType<typeof vi.fn>).mockResolvedValue(mockSessions);
      (database.updateSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('First Session')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      const titleInput = screen.getByPlaceholderText('Session Title *');
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Session');

      const updateButton = screen.getByText('Update Session');
      await user.click(updateButton);

      await waitFor(() => {
        expect(database.updateSession).toHaveBeenCalledWith(1, {
          title: 'Updated Session',
          description: 'First description',
          session_date: '2025-10-13',
          notes: 'First notes',
        });
      });
    });

    it('should cancel edit and clear form', async () => {
      const user = userEvent.setup();
      (database.getAllSessions as ReturnType<typeof vi.fn>).mockResolvedValue(mockSessions);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('First Session')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Edit');
      await user.click(editButtons[0]);

      expect(screen.getByText('Update Session')).toBeInTheDocument();

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      const titleInput = screen.getByPlaceholderText('Session Title *') as HTMLInputElement;
      expect(titleInput.value).toBe('');
      expect(screen.getByText('Create Session')).toBeInTheDocument();
    });
  });

  describe('Delete Session', () => {
    it('should delete session when confirmed', async () => {
      const user = userEvent.setup();
      (database.getAllSessions as ReturnType<typeof vi.fn>).mockResolvedValue(mockSessions);
      (database.deleteSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      mockConfirm.mockReturnValue(true);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('First Session')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith('Are you sure you want to delete this session?');

      await waitFor(() => {
        expect(database.deleteSession).toHaveBeenCalledWith(1);
      });
    });

    it('should not delete session when cancelled', async () => {
      const user = userEvent.setup();
      (database.getAllSessions as ReturnType<typeof vi.fn>).mockResolvedValue(mockSessions);
      mockConfirm.mockReturnValue(false);

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('First Session')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Delete');
      await user.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalled();
      expect(database.deleteSession).not.toHaveBeenCalled();
    });
  });
});
