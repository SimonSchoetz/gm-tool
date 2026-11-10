// A code request means this device shows the code; a chosen candidate without one means it waits for the user to enter the code the other device shows.
export const getPairDialogMode = (
  codeRequest: object | null,
  requestedCandidateId: string | null,
): 'list' | 'entering-code' | 'showing-code' => {
  if (codeRequest !== null) return 'showing-code';
  return requestedCandidateId !== null ? 'entering-code' : 'list';
};
