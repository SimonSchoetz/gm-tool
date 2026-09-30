import { useState, useEffect, useRef } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { Input } from '../Input/Input';
import { ClickableIcon } from '../ClickableIcon/ClickableIcon';
import { useTypographicInput } from '@/hooks';
import { FCProps } from '@/types';
import './SearchInput.css';

type Props = {
  onSearch: (term: string) => void;
  placeholder?: string;
  debounceMs?: number;
};

export const SearchInput: FCProps<Props> = ({
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
}) => {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = (term: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(term);
    }, debounceMs);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const { inputRef, handleChange } = useTypographicInput((newValue) => {
    setValue(newValue);
    debouncedSearch(newValue);
  });

  const handleClear = () => {
    setValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onSearch('');
  };

  return (
    <div className='search-input'>
      <SearchIcon className='search-input-icon' />
      <Input
        ref={inputRef}
        className='search-input-field'
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {value && (
        <ClickableIcon
          icon={<XIcon />}
          label='Clear search'
          className='search-input-clear'
          type='button'
          onClick={handleClear}
        />
      )}
    </div>
  );
};
