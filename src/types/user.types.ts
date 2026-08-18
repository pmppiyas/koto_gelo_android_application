import { BaseEntity, ID } from './common.types';

export interface User extends BaseEntity {
  name: string;
  email: string;
  avatarUrl?: string | null;
  phone?: string | null;
}

export interface UserProfile extends User {
  currency: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
}
