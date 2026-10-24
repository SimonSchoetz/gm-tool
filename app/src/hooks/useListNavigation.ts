import { useState } from 'react';
import { SlideDirection } from '@/types/slideDirection.type';

const readDirection = (from: number, to: number): SlideDirection | null => {
  if (to === -1) return null;
  if (to > from) return 'forward';
  if (to < from) return 'backward';
  return null;
};

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
  const hasNext = selectedIndex < items.length - 1;

  const moveTo = (id: string) => {
    const direction = readDirection(
      selectedIndex,
      items.findIndex((item) => item.id === id),
    );
    setTransition(
      direction === null ? null : { from: items[selectedIndex], direction },
    );
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
