import { createContext } from 'react';
import type { useDraggable } from '@/hooks/useDraggable';

export type MentionPopupHeaderContextValue = {
  name: string;
  isPinned: boolean;
  draggableProps: ReturnType<typeof useDraggable>['draggableProps'];
  onPin: () => void;
  onRemove: () => void;
  onNavigate: () => void;
};

export const MentionPopupHeaderContext =
  createContext<MentionPopupHeaderContextValue | null>(null);
