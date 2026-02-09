import { createContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Adventure } from '@db/adventure';
import * as service from '@/services/adventureService';

type AdventureContextType = {
  adventures: Adventure[];
  loading: boolean;
  createAdventure: () => Promise<string>;
  deleteAdventure: (id: string) => Promise<void>;
};

export const AdventureContext = createContext<AdventureContextType | null>(
  null,
);

type AdventureProviderProps = {
  children: ReactNode;
};

export const AdventureProvider = ({ children }: AdventureProviderProps) => {
  const queryClient = useQueryClient();

  // Query: Fetch all adventures
  const { data: adventures = [], isPending: isLoadingAdventures } = useQuery({
    queryKey: ['adventures'],
    queryFn: service.getAllAdventures,
  });

  // Mutation: Create adventure
  const createMutation = useMutation({
    mutationFn: service.createAdventure,
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['adventures'] });
      return id;
    },
  });

  // Mutation: Delete adventure
  const deleteMutation = useMutation({
    mutationFn: ({ adventureId }: { adventureId: string }) =>
      service.deleteAdventure(adventureId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adventures'] });
    },
  });

  // Public API
  const createAdventure = async (): Promise<string> => {
    return createMutation.mutateAsync();
  };

  const deleteAdventure = async (adventureId: string): Promise<void> => {
    await deleteMutation.mutateAsync({ adventureId });
  };

  const value: AdventureContextType = {
    adventures,
    loading: isLoadingAdventures,
    createAdventure,
    deleteAdventure,
  };

  return (
    <AdventureContext.Provider value={value}>
      {children}
    </AdventureContext.Provider>
  );
};
