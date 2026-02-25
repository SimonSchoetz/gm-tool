export class MentionSearchError extends Error {
  constructor(cause?: unknown) {
    super('Failed to search mentions');
    this.name = 'MentionSearchError';
    this.cause = cause;
  }
}
