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
  initAdventure: (id: string) => Promise<void>;
  updateAdventure: (field: UpdateAdventureData) => void;
  createAdventure: () => Promise<string>;
  deleteAdventure: (id: string) => Promise<void>;
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

  const initAdventure = async (id: string) => {
    if (adventures.length === 0) {
      await loadAdventures();
    }

    const foundAdventure = adventures.find((adv) => adv.id === id);

    if (foundAdventure) {
      setAdventure(foundAdventure);
    } else {
      setError(`Can't find adventure with id ${id}`);
      throw new Error(`Can't find adventure with id ${id}`);
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

    // Clear previous timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce DB save (500ms after last change)
    debounceTimeoutRef.current = setTimeout(() => {
      updateAdventureInDb(adventure.id, data).catch((error) => {
        console.error('Failed to auto-save adventure:', error);
      });
    }, 500);
  };

  const updateAdventureInDb = async (id: string, data: UpdateAdventureData) => {
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
      await loadAdventures();
      if (id && adventure?.id === id) {
        await initAdventure(id);
      }
    } catch (err) {
      console.error('Failed to update adventure:', err);
      throw err;
    }
  };

  const createAdventure = async (): Promise<string> => {
    try {
      const dto: CreateAdventureInput = {
        title: `New adventure ${new Date().toLocaleDateString()}`,
      };

      return await adventureDb.create(dto);
    } catch (err) {
      console.error('Failed to create adventure:', err);
      throw err;
    }
  };

  const deleteAdventure = async (id: string) => {
    await initAdventure(id);

    if (adventure?.image_id) {
      await imageDb.remove(adventure.image_id);
    }

    try {
      /**
       * TODO:
       * - trigger delete all sessions that belong to adventure
       * - trigger delete all NPCs that belong to adventure
       * ... -> needs a logic that triggers deletion of everything that belongs to the adventure (probably FK adventure_id in all other tables)
       */
      await adventureDb.remove(id);
      await loadAdventures();
    } catch (err) {
      console.error('Failed to delete adventure:', err);
      throw err;
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
