import { queryOptions } from '@tanstack/react-query';
import * as service from '@services/locationsService';
import { locationKeys } from './locationKeys';

export const locationListQueryOptions = (adventureId: string) =>
  queryOptions({
    queryKey: locationKeys.list(adventureId),
    queryFn: () => service.getAllLocations(adventureId),
    enabled: !!adventureId,
    throwOnError: true,
  });

export const locationQueryOptions = (locationId: string) =>
  queryOptions({
    queryKey: locationKeys.detail(locationId),
    queryFn: () => service.getLocationById(locationId),
    enabled: !!locationId,
    staleTime: 0,
    refetchOnMount: 'always',
    throwOnError: true,
  });
