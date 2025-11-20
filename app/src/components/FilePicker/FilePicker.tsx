import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import Button from '../Button/Button';
import './FilePicker.css';

type ButtonVariant = 'primary' | 'secondary' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

type FilePickerProps = {
  accept?: string[];
  multiple?: boolean;
  onSelect: (filePath: string | string[]) => void;
  onError?: (error: Error) => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: React.ReactNode;
  disabled?: boolean;
};

const FilePicker = ({
  accept,
  multiple = false,
  onSelect,
  onError,
  variant = 'secondary',
  size = 'medium',
  children = 'Choose File',
  disabled = false,
}: FilePickerProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const selected = await open({
        multiple,
        filters: accept
          ? [
              {
                name: 'Allowed Files',
                extensions: accept,
              },
            ]
          : undefined,
      });

      if (selected) {
        onSelect(selected);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === 'string') {
        setError(error);
      } else {
        setError(`Failed to open file picker: ${err}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleClick}
        disabled={disabled || isLoading}
        variant={variant}
        size={size}
        className='file-picker'
      >
        {isLoading ? 'Loading...' : children}
      </Button>
      {error && error}
    </>
  );
};

export default FilePicker;
