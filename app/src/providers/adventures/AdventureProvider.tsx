import { createContext, useEffect, useState, ReactNode, useRef } from 'react';
import type { Adventure } from '@db/adventure';
import * as service from '@/services/adventureService';
import type { UpdateAdventureData } from '@/services/adventureService';
import { AdventureLoadError, AdventureUpdateError } from '@/domain/adventures';

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
      const loadedAdventures = await service.getAllAdventures();
      console.log(
        '>>>>>>>>> | loadAdventures | loadedAdventures:',
        loadedAdventures,
      );
      setAdventures(loadedAdventures);
      setError(null);
    } catch (err) {
      const loadError = new AdventureLoadError(err);
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  const initAdventure = async (idOrAdventure: string | Adventure) => {
    console.log('>>>>>>>>> | initAdventure | idOrAdventure:', idOrAdventure);
    if (typeof idOrAdventure === 'string') {
      const adventureList = await service.getAllAdventures();
      console.log('>>>>>>>>> | initAdventure | adventureList:', adventureList);
      const foundAdventure = await service.getAdventureById(
        idOrAdventure,
        adventureList,
      );
      setAdventure(foundAdventure);
    } else {
      setAdventure(idOrAdventure);
    }
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
      await service.updateAdventure(id, data);

      await loadAdventures();
      console.log(adventure);
      console.log(adventures);
    } catch (err) {
      throw new AdventureUpdateError(id, err);
    }
  };

  const createAdventure = async (): Promise<string> => {
    const id = await service.createAdventure();
    await loadAdventures();
    return id;
  };

  const deleteAdventure = async (id: string) => {
    await service.deleteAdventure(id, adventure ?? undefined);
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
