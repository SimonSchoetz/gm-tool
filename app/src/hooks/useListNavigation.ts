import { useState } from 'react';

type ListNavigation<T> = {
  selected: T | null;
  isNavAvailable: boolean;
  isNavVisible: boolean;
  select: (id: string) => void;
  toggleNav: () => void;
};

export const useListNavigation = <T extends { id: string }>(
  items: T[],
): ListNavigation<T> => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  const selected =
    items.find((item) => item.id === selectedId) ?? items.at(0) ?? null;
  const isNavAvailable = items.length > 1;
  const isNavVisible = isNavOpen && isNavAvailable;

  const select = (id: string) => {
    setSelectedId(id);
    setIsNavOpen(false);
  };

  const toggleNav = () => {
    setIsNavOpen((isOpen) => !isOpen);
  };

  return { selected, isNavAvailable, isNavVisible, select, toggleNav };
};
