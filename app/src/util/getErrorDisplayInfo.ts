export type ErrorDisplayInfo = { message: string; stack: string | null };

export const getErrorDisplayInfo = (error: unknown): ErrorDisplayInfo => {
  const isError = error instanceof Error;
  return {
    message: isError ? error.message : String(error),
    stack: isError ? (error.stack ?? null) : null,
  };
};
