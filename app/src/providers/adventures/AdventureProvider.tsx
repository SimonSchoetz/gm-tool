import { createContext, useEffect, useState, ReactNode, useRef } from 'react';
import type { Adventure } from '@db/adventure';
import * as adventureService from '@/services/adventureService';
import type { UpdateAdventureData } from '@/services/adventureService';
import { AdventureLoadError, AdventureUpdateError } from './errors';

type AdventureContextType = {
  adventures: Adventure[];
  adventure: Adventure | null;
  loading: boolean;
  error: string | null;
  saveError: string | null;
  setAdventure: (adventure: Adventure | null) => void;
  initAdventure: (id: string) => Promise<void>;
  updateAdventure: (field: UpdateAdventureData) => void;
  createAdventure: () => Promise<string>;
  deleteAdventure: (id: string) => Promise<void>;
};

export const AdventureContext = createContext<AdventureContextType | null>(
  null,
);

type AdventureProviderProps = {
  children: ReactNode;
};

export const AdventureProvider = ({ children }: AdventureProviderProps) => {
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [adventure, setAdventure] = useState<Adventure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadAdventures = async () => {
    try {
      setLoading(true);
      const loadedAdventures = await adventureService.loadAllAdventures();
      setAdventures(loadedAdventures);
      setError(null);
    } catch (err) {
      const loadError = new AdventureLoadError(err);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  const initAdventure = async (id: string) => {
    const adventureList =
      adventures.length === 0
        ? await adventureService.loadAllAdventures()
        : adventures;
    const foundAdventure = await adventureService.loadAdventureById(
      id,
      adventureList,
    );
    setAdventure(foundAdventure);
  };

  const updateAdventure = (data: UpdateAdventureData) => {
    if (!adventure) return;

    // Update state immediately (optimistic)
    const updated = {
      ...adventure,
      ...data,
    };
    setAdventure(updated);
    setSaveError(null);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce DB save (500ms after last change)
    debounceTimeoutRef.current = setTimeout(() => {
      updateAdventureInDb(adventure.id, data).catch((error) => {
        if (error instanceof AdventureUpdateError) {
          setSaveError(error.message);
        } else {
          setSaveError('Failed to save changes');
        }
      });
    }, 500);
  };

  const updateAdventureInDb = async (id: string, data: UpdateAdventureData) => {
    try {
      await adventureService.updateAdventure(id, data);

      await loadAdventures();
      if (id && adventure?.id === id) {
        await initAdventure(id);
      }
    } catch (err) {
      throw new AdventureUpdateError(id, err);
    }
  };

  const createAdventure = async (): Promise<string> => {
    return await adventureService.createAdventure();
  };

  const deleteAdventure = async (id: string) => {
    await adventureService.deleteAdventure(id, adventure ?? undefined);
    await loadAdventures();
  };

  useEffect(() => {
    loadAdventures();
  }, []);

  const value: AdventureContextType = {
    adventures,
    adventure,
    loading,
    error,
    saveError,
    initAdventure,
    setAdventure,
    updateAdventure,
    createAdventure,
    deleteAdventure,
  };

  return (
    <AdventureContext.Provider value={value}>
      {children}
    </AdventureContext.Provider>
  );
};
