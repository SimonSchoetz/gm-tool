import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  BaseEntityContentSection,
  UpdateBaseEntityContentSectionInput,
} from '@db/base-entity-content-section';
import type { BaseEntityContentSectionType } from '@domain';
import * as service from '@services/baseEntityContentSectionService';
import { baseEntityContentSectionKeys } from './baseEntityContentSectionKeys';
import { baseEntityContentSectionListQueryOptions } from './baseEntityContentSectionQueryOptions';
import { createAutosaveQueue } from '../createAutosaveQueue';
import { mergeUpdate } from '../mergeUpdate';

type UseBaseEntityContentSectionsReturn = {
  sections: BaseEntityContentSection[];
  summarySection: BaseEntityContentSection | null;
  loading: boolean;
  createSection: (
    type: BaseEntityContentSectionType,
    name?: string,
  ) => Promise<string>;
  updateSection: (
    sectionId: string,
    data: UpdateBaseEntityContentSectionInput,
  ) => void;
  deleteSection: (sectionId: string) => Promise<void>;
  bulkReorder: (orderedSectionIds: string[]) => void;
};

export const useBaseEntityContentSections = (
  baseEntityId: string,
): UseBaseEntityContentSectionsReturn => {
  const queryClient = useQueryClient();

  const { data: sections = [], isPending: loading } = useQuery(
    baseEntityContentSectionListQueryOptions(baseEntityId),
  );

  const summarySection =
    sections.find((section) => section.type === 'text') ?? null;

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateBaseEntityContentSectionInput;
    }) => service.updateSection(id, data),
  });

  const [saveQueue] = useState(() =>
    createAutosaveQueue<UpdateBaseEntityContentSectionInput>(
      (pending, patch) => ({ ...pending, ...patch }),
      (id, data) => {
        updateMutation.mutate({ id, data });
      },
    ),
  );

  useEffect(() => {
    return () => {
      saveQueue.flushAll();
    };
  }, [saveQueue]);

  const createMutation = useMutation({
    mutationFn: ({
      type,
      name,
    }: {
      type: BaseEntityContentSectionType;
      name?: string;
    }) => service.createSection(baseEntityId, type, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: baseEntityContentSectionKeys.list(baseEntityId),
      });
    },
  });

  const bulkReorderMutation = useMutation({
    mutationFn: (orderedSectionIds: string[]) =>
      service.bulkReorderSections(orderedSectionIds),
    onError: () => {
      void queryClient.invalidateQueries({
        queryKey: baseEntityContentSectionKeys.list(baseEntityId),
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (sectionId: string) => service.deleteSection(sectionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: baseEntityContentSectionKeys.list(baseEntityId),
      });
    },
  });

  const updateSection = (
    sectionId: string,
    data: UpdateBaseEntityContentSectionInput,
  ) => {
    queryClient.setQueryData<BaseEntityContentSection[]>(
      baseEntityContentSectionKeys.list(baseEntityId),
      (old) => {
        if (!old) return old;
        return old.map((section) =>
          section.id === sectionId ? mergeUpdate(section, data) : section,
        );
      },
    );

    saveQueue.schedule(sectionId, data);
  };

  const createSection = async (
    type: BaseEntityContentSectionType,
    name?: string,
  ): Promise<string> =>
    createMutation.mutateAsync(name !== undefined ? { type, name } : { type });

  const deleteSection = async (sectionId: string): Promise<void> => {
    await deleteMutation.mutateAsync(sectionId);
  };

  const bulkReorder = (orderedSectionIds: string[]): void => {
    queryClient.setQueryData<BaseEntityContentSection[]>(
      baseEntityContentSectionKeys.list(baseEntityId),
      (old) => {
        if (!old) return old;
        const idToSection = new Map(old.map((s) => [s.id, s]));
        return orderedSectionIds
          .map((id, index) => {
            const section = idToSection.get(id);
            return section ? { ...section, sort_order: index } : null;
          })
          .filter((s): s is BaseEntityContentSection => s !== null);
      },
    );
    bulkReorderMutation.mutate(orderedSectionIds);
  };

  return {
    sections,
    summarySection,
    loading,
    createSection,
    updateSection,
    deleteSection,
    bulkReorder,
  };
};
