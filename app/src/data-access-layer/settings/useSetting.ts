import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSetting, updateSetting } from '@db/_settings';
import type { SettingsKey, SettingsValueMap } from '@db/_settings';
import { settingsKeys } from './settingsKeys';

export const useSetting = <K extends SettingsKey>(
  key: K,
): { value: SettingsValueMap[K] | null; update: (value: SettingsValueMap[K]) => void } => {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: settingsKeys.setting(key),
    queryFn: () => getSetting(key),
    throwOnError: true,
  });

  const mutation = useMutation({
    mutationFn: (value: SettingsValueMap[K]) => updateSetting(key, value),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: settingsKeys.setting(key),
      });
    },
  });

  const update = (value: SettingsValueMap[K]) => {
    mutation.mutate(value);
  };

  return {
    value: data ?? null,
    update,
  };
};
