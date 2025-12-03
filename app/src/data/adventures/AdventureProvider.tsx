import { createContext, useEffect, useState, ReactNode } from 'react';
import { initDatabase } from '@db/database';
import type {
  Adventure,
  CreateAdventureInput,
  UpdateAdventureInput,
} from '@db/adventure';
import * as adventure from '@db/adventure';
import * as image from '@db/image';

type AdventureContextType = {
  adventures: Adventure[];
  loading: boolean;
  error: string | null;
  createAdventure: (data: CreateAdventureFormData) => Promise<void>;
  updateAdventure: (id: string, data: UpdateAdventureInput) => Promise<void>;
  deleteAdventure: (id: string) => Promise<void>;
  refreshAdventures: () => Promise<void>;
};

export type CreateAdventureFormData = Omit<CreateAdventureInput, 'image_id'> & {
  imgFilePath?: string;
};

export type UpdateAdventureFormData = UpdateAdventureInput & {
  imgFilePath?: string;
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

  const createAdventure = async (data: CreateAdventureFormData) => {
    let image_id: string | null = null;

    try {
      if (data.imgFilePath) {
        image_id = await image.create({ filePath: data.imgFilePath });
      }

      const dto: CreateAdventureInput = {
        title: data.title,
        description: data?.description,
        image_id,
      };

      await adventure.create(dto);
      await loadAdventures();
    } catch (err) {
      console.error('Failed to create adventure:', err);
      throw err;
    }
  };

  const updateAdventure = async (id: string, data: UpdateAdventureFormData) => {
    let image_id: string | null | undefined = undefined;

    try {
      if (data.imgFilePath && data.image_id) {
        image_id = await image.replace(data.image_id, {
          filePath: data.imgFilePath,
        });
      }

      if (data.imgFilePath && !data.image_id) {
        image_id = await image.create({ filePath: data.imgFilePath });
      }

      const dto: UpdateAdventureInput = {
        title: data.title,
        description: data?.description,
        image_id,
      };

      await adventure.update(id, dto);
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
