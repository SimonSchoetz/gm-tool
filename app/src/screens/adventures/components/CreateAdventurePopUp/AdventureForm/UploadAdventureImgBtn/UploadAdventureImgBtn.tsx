import { filePicker } from '@/util';
import { useState } from 'react';
import AdventureBtn from '../../../AdventureBtn/AdventureBtn';
import { convertFileSrc } from '@tauri-apps/api/core';
import { FCProps } from '@/types';

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
      <AdventureBtn onClick={handleClick} label='Upload cover image'>
        {filePath ? (
          <img src={convertFileSrc(filePath)} alt='Adventure preview' />
        ) : (
          <p
            style={{
              textAlign: 'center',
            }}
          >
            Click to upload cover image or drag&drop
          </p>
        )}
      </AdventureBtn>
      {error && error}
    </>
  );
};
