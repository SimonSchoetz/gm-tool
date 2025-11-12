import { createContext, useEffect, useState, ReactNode } from 'react';
import { initDatabase } from '@db/database';
import type {
  Adventure,
  CreateAdventureInput,
  UpdateAdventureInput,
} from '@db/adventure';
import * as adventure from '@db/adventure';

type AdventureContextType = {
  adventures: Adventure[];
  loading: boolean;
  error: string | null;
  createAdventure: (data: CreateAdventureInput) => Promise<void>;
  updateAdventure: (id: string, data: UpdateAdventureInput) => Promise<void>;
  deleteAdventure: (id: string) => Promise<void>;
  refreshAdventures: () => Promise<void>;
};

export const AdventureContext = createContext<AdventureContextType | null>(
  null
);

type AdventureProviderProps = {
  children: ReactNode;
};

export const AdventureProvider = ({ children }: AdventureProviderProps) => {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAdventures = async () => {
    try {
      setLoading(true);
      const result = await adventure.getAll();
      setAdventures(result.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load adventures:', err);
      setError(`Failed to load adventures: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const createAdventure = async (data: CreateAdventureInput) => {
    try {
      await adventure.create(data);
      await loadAdventures();
    } catch (err) {
      console.error('Failed to create adventure:', err);
      throw err;
    }
  };

  const updateAdventure = async (id: string, data: UpdateAdventureInput) => {
    try {
      await adventure.update(id, data);
      await loadAdventures();
    } catch (err) {
      console.error('Failed to update adventure:', err);
      throw err;
    }
  };

  const deleteAdventure = async (id: string) => {
    try {
      await adventure.remove(id);
      await loadAdventures();
    } catch (err) {
      console.error('Failed to delete adventure:', err);
      throw err;
    }
  };

  const refreshAdventures = async () => {
    await loadAdventures();
  };

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
        await loadAdventures();
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(`Database error: ${err}`);
        setLoading(false);
      }
    };
    init();
  }, []);

  const value: AdventureContextType = {
    adventures,
    loading,
    error,
    createAdventure,
    updateAdventure,
    deleteAdventure,
    refreshAdventures,
  };

  return (
    <AdventureContext.Provider value={value}>
      {children}
    </AdventureContext.Provider>
  );
};
