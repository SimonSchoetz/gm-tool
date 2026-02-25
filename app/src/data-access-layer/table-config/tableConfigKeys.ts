export const tableConfigKeys = {
  all: () => ['tableConfig'] as const,
  detail: (tableId: string) => ['tableConfig', tableId] as const,
};
