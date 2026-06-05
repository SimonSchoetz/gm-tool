export type DownloadProgressEvent = {
  event: 'progress';
  data: { chunkLength: number; contentLength: number | null };
};
