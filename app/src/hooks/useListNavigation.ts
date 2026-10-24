import { useState } from 'react';
import { SlideDirection } from '@/types/slideDirection.type';

type ListTransition<T> = { from: T; direction: SlideDirection };

type ListNavigation<T> = {
  selected: T | null;
  isNavAvailable: boolean;
  isNavVisible: boolean;
  select: (id: string) => void;
  toggleNav: () => void;
  closeNav: () => void;
  transition: ListTransition<T> | null;
  hasPrevious: boolean;
  hasNext: boolean;
  stepPrevious: () => void;
  stepNext: () => void;
  endTransition: () => void;
};

export const useListNavigation = <T extends { id: string }>(
  items: T[],
): ListNavigation<T> => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [transition, setTransition] = useState<ListTransition<T> | null>(null);

  const selected =
    items.find((item) => item.id === selectedId) ?? items.at(0) ?? null;
  const isNavAvailable = items.length > 1;
  const isNavVisible = isNavOpen && isNavAvailable;

  const selectedIndex = selected
    ? items.findIndex((item) => item.id === selected.id)
    : -1;
  const hasPrevious = selectedIndex > 0;
  const hasNext = selectedIndex !== -1 && selectedIndex < items.length - 1;

  const moveTo = (id: string) => {
    const targetIndex = items.findIndex((item) => item.id === id);
    if (selected === null || targetIndex === -1 || id === selected.id) {
      setTransition(null);
    } else {
      setTransition({
        from: selected,
        direction: targetIndex > selectedIndex ? 'forward' : 'backward',
      });
    }
    setSelectedId(id);
  };

  const select = (id: string) => {
    moveTo(id);
    setIsNavOpen(false);
  };

  const stepPrevious = () => {
    if (hasPrevious) moveTo(items[selectedIndex - 1].id);
  };

  const stepNext = () => {
    if (hasNext) moveTo(items[selectedIndex + 1].id);
  };

  const endTransition = () => {
    setTransition(null);
  };

  const toggleNav = () => {
    setIsNavOpen((isOpen) => !isOpen);
  };

  const closeNav = () => {
    setIsNavOpen(false);
  };

  return {
    selected,
    isNavAvailable,
    isNavVisible,
    select,
    toggleNav,
    closeNav,
    transition,
    hasPrevious,
    hasNext,
    stepPrevious,
    stepNext,
    endTransition,
  };
};
