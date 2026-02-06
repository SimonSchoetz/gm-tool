import { createContext, useEffect, useState, ReactNode } from 'react';
import { initDatabase } from '@db/database';
import type { Image } from '@db/image';
import * as image from '@db/image';

type ImageContextType = {
  images: Map<string, Image>;
  error: string | null;
  createImage: (filePath: string) => Promise<string>;
  deleteImage: (id: string) => Promise<void>;
  replaceImage: (oldId: string, filePath: string) => Promise<string>;
  getImageById: (id: string) => Promise<Image | null>;
};

export const ImageContext = createContext<ImageContextType | null>(null);

type ImageProviderProps = {
  children: ReactNode;
};

export const ImageProvider = ({ children }: ImageProviderProps) => {
  const [images, setImages] = useState<Map<Image['id'], Image>>(new Map());
  const [error, setError] = useState<string | null>(null);

  const createImage = async (filePath: string): Promise<Image['id']> => {
    try {
      const id = await image.create({ filePath });
      const newImage = await image.get(id);
      if (newImage) {
        setImages((prev) => new Map(prev).set(id, newImage));
      }
      return id;
    } catch (err) {
      console.error('Failed to create image:', err);
      throw err;
    }
  };

  const deleteImage = async (id: Image['id']) => {
    try {
      await image.remove(id);
      setImages((prev) => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      console.error('Failed to delete image:', err);
      throw err;
    }
  };

  const replaceImage = async (
    oldId: string,
    filePath: string
  ): Promise<string> => {
    await deleteImage(oldId);
    const newId = await createImage(filePath);
    return newId;
  };

  const getImageById = async (id: string): Promise<Image | null> => {
    try {
      const cached = images.get(id);
      if (cached) {
        return cached;
      }

      const fetchedImage = await image.get(id);
      if (fetchedImage) {
        setImages((prev) => new Map(prev).set(id, fetchedImage));
        return fetchedImage;
      }

      return null;
    } catch (err) {
      console.error('Failed to get image:', err);
      return null;
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await initDatabase();
      } catch (err) {
        console.error('Failed to initialize database:', err);
        setError(`Database error: ${err}`);
      }
    };
    init();
  }, []);

  const value: ImageContextType = {
    images,
    error,
    createImage,
    deleteImage,
    replaceImage,
    getImageById,
  };

  return (
    <ImageContext.Provider value={value}>{children}</ImageContext.Provider>
  );
};
