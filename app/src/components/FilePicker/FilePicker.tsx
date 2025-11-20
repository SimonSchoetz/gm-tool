import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import Button from '../Button/Button';
import './FilePicker.css';

const fileTypes: Record<string, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  document: ['.pdf', '.md'],
};

type ButtonProps = React.ComponentProps<typeof Button>;

type FilePickerProps = {
  fileType: keyof typeof fileTypes;
  multiple?: boolean;
  onSelect: (filePath: string | string[]) => void;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  children?: React.ReactNode;
  disabled?: boolean;
};

const FilePicker = ({
  fileType,
  multiple = false,
  onSelect,
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
      const extensions = fileTypes[fileType];
      const selected = await open({
        multiple,
        filters: extensions
          ? [
              {
                name: 'Allowed Files',
                extensions: extensions,
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
