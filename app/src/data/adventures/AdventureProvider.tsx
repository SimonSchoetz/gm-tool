import { createContext, useEffect, useState, ReactNode, useRef } from 'react';
import { initDatabase } from '@db/database';
import type {
  Adventure,
  CreateAdventureInput,
  UpdateAdventureInput,
} from '@db/adventure';
import * as adventureDb from '@db/adventure';
import * as imageDb from '@db/image';

type AdventureContextType = {
  adventures: Adventure[];
  adventure: Adventure | null;
  loading: boolean;
  error: string | null;
  setAdventure: (adventure: Adventure | null) => void;
  loadAdventure: (id: string) => Promise<void>;
  getAdventure: (data: string) => Promise<Adventure>;
  handleAdventureUpdate: (field: UpdateAdventureData) => void;
  createAdventure: () => Promise<string>;
  updateAdventure: (id: string, data: UpdateAdventureInput) => Promise<void>;
  deleteAdventure: (id: string) => Promise<void>;
  refreshAdventures: () => Promise<void>;
};

export type UpdateAdventureData = UpdateAdventureInput & {
  imgFilePath?: string;
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

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadAdventures = async () => {
    try {
      setLoading(true);
      const result = await adventureDb.getAll();
      setAdventures(result.data);
      setError(null);
    } catch (err) {
      console.error('Failed to load adventures:', err);
      setError(`Failed to load adventures: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const getAdventure = async (id: string) => {
    // First try to find in current state
    let foundAdventure = adventures.find((adv) => adv.id === id);

    // If not found and state is empty, fetch directly from database
    if (!foundAdventure && adventures.length === 0) {
      foundAdventure = (await adventureDb.get(id)) ?? undefined;
    }

    if (!foundAdventure) {
      const errorMsg = `Can't find adventure with id ${id}`;
      console.error(errorMsg);
      throw Error(errorMsg);
    }

    return foundAdventure;
  };

  const loadAdventure = async (id: string): Promise<void> => {
    const currentAdventure = await adventureDb.get(id);
    if (currentAdventure) {
      setAdventure(currentAdventure);
    }
  };

  const handleAdventureUpdate = (data: UpdateAdventureData) => {
    if (!adventure) return;

    // Update state immediately (optimistic)
    const updated = {
      ...adventure,
      ...data,
    };
    setAdventure(updated);

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce DB save (500ms after last change)
    debounceTimeoutRef.current = setTimeout(() => {
      updateAdventure(adventure.id, data).catch((error) => {
        console.error('Failed to auto-save adventure:', error);
      });
    }, 500);
  };

  const createAdventure = async (): Promise<string> => {
    try {
      const dto: CreateAdventureInput = {
        title: `New adventure ${new Date().toDateString()}`,
      };

      return await adventureDb.create(dto);
    } catch (err) {
      console.error('Failed to create adventure:', err);
      throw err;
    }
  };

  const updateAdventure = async (id: string, data: UpdateAdventureData) => {
    let image_id: string | null | undefined = undefined;

    try {
      if (data.imgFilePath && data.image_id) {
        image_id = await imageDb.replace(data.image_id, {
          filePath: data.imgFilePath,
        });
      }

      if (data.imgFilePath && !data.image_id) {
        image_id = await imageDb.create({ filePath: data.imgFilePath });
      }

      // Remove imgFilePath (not a DB field) and override image_id if created/replaced
      const { imgFilePath, ...dto } = data;
      if (image_id !== undefined) {
        dto.image_id = image_id;
      }

      await adventureDb.update(id, dto);

      // Reload adventures list and current adventure to keep state in sync
      await refreshAdventures(id);
    } catch (err) {
      console.error('Failed to update adventure:', err);
      throw err;
    }
  };

  const deleteAdventure = async (id: string) => {
    try {
      await adventureDb.remove(id);
      await loadAdventures();
    } catch (err) {
      console.error('Failed to delete adventure:', err);
      throw err;
    }
  };

  const refreshAdventures = async (id?: string) => {
    await loadAdventures();
    if (id && adventure?.id === id) {
      await loadAdventure(id);
    }
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
    adventure,
    loading,
    error,
    getAdventure,
    loadAdventure,
    setAdventure,
    handleAdventureUpdate,
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
