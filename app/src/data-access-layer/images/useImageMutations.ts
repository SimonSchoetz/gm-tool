import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as imageService from '@/services/imageService';
import { imageKeys } from './imageKeys';

type UseImageMutationsReturn = {
  createImage: (filePath: string) => Promise<string>;
  deleteImage: (id: string) => Promise<void>;
  replaceImage: (oldId: string, filePath: string) => Promise<string>;
};

export const useImageMutations = (): UseImageMutationsReturn => {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (filePath: string) => imageService.createImage(filePath),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => imageService.deleteImage(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: imageKeys.detail(id) });
    },
  });

  const replaceMutation = useMutation({
    mutationFn: ({ oldId, filePath }: { oldId: string; filePath: string }) =>
      imageService.replaceImage(oldId, filePath),
    onSuccess: (_, { oldId }) => {
      queryClient.removeQueries({ queryKey: imageKeys.detail(oldId) });
    },
  });

  return {
    createImage: (filePath) => createMutation.mutateAsync(filePath),
    deleteImage: (id) => deleteMutation.mutateAsync(id),
    replaceImage: (oldId, filePath) => replaceMutation.mutateAsync({ oldId, filePath }),
  };
};
