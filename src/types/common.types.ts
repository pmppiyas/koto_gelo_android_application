export type ID = string;

export interface BaseEntity {
  id: ID;
  createdAt: string;
  updatedAt: string;
}

export type Status = 'idle' | 'loading' | 'succeeded' | 'failed';

export type Nullable<T> = T | null;
