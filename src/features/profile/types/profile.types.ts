import { UserProfile } from '../../../types/user.types';

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  avatarUrl?: string;
  currency?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
}

export type { UserProfile };
