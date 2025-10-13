export type Session = {
  id?: string;
  title: string;
  description?: string;
  session_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
};

export type PaginationParams = {
  limit?: number;
  offset?: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};
