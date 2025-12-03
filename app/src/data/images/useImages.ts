import { useContext } from 'react';
import { ImageContext } from './ImageProvider';

export const useImages = () => {
  const context = useContext(ImageContext);

  if (!context) {
    throw new Error('useImages must be used within an ImageProvider');
  }

  return context;
};
