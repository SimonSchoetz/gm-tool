export const locationKeys = {
  list: (adventureId: string) => ['locations', adventureId] as const,
  detail: (locationId: string) => ['location', locationId] as const,
};
