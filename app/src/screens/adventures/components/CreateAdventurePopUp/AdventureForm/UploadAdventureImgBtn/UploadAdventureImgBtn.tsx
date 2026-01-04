import { filePicker } from '@/util';
import { useState } from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import { FCProps } from '@/types';
import { NewAdventureBtn } from '../../../NewAdventureBtn/NewAdventureBtn';

export const UploadAdventureImgBtn: FCProps<{
  onClick: (filePath: string) => void;
}> = ({ onClick }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [filePath, setFilePath] = useState<string | null>(null);

  const handleClick = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const filePath = await filePicker('image');

      if (filePath === null) {
        return;
      } else {
        setFilePath(filePath);
        onClick(filePath);
      }
    } catch (err) {
      setError(err?.toString());
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <NewAdventureBtn onClick={handleClick} label='Upload cover image'>
        {filePath ? (
          <img src={convertFileSrc(filePath)} alt='Adventure preview' />
        ) : (
          <p
            style={{
              textAlign: 'center',
            }}
          >
            {isLoading
              ? 'Loading...'
              : 'Click to upload cover image or drag&drop'}
          </p>
        )}
      </NewAdventureBtn>
      {error && error}
    </>
  );
};
