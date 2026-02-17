import { useState, useCallback, useEffect, useRef } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import './SearchInput.css';

type SearchInputProps = {
  onSearch: (term: string) => void;
  placeholder?: string;
  debounceMs?: number;
};

export const SearchInput = ({
  onSearch,
  placeholder = 'Search...',
  debounceMs = 300,
}: SearchInputProps) => {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSearch = useCallback(
    (term: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onSearch(term), debounceMs);
    },
    [onSearch, debounceMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedSearch(newValue);
  };

  const handleClear = () => {
    setValue('');
    if (timerRef.current) clearTimeout(timerRef.current);
    onSearch('');
  };

  return (
    <div className='search-input'>
      <SearchIcon className='search-input__icon' />
      <input
        className='search-input__field'
        type='text'
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
      />
      {value && (
        <button
          className='search-input__clear'
          onClick={handleClear}
          type='button'
          aria-label='Clear search'
        >
          <XIcon />
        </button>
      )}
    </div>
  );
};
