import { BaseEntity } from '../../../types/common.types';

export interface GroupMember {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role: 'ADMIN' | 'MEMBER';
}

export interface Group extends BaseEntity {
  name: string;
  description?: string;
  currency: string;
  type?: 'TRIP' | 'HOME' | 'COUPLE' | 'OTHER';
  members: GroupMember[];
}

export interface CreateGroupDto {
  name: string;
  description?: string;
  currency: string;
  type?: 'TRIP' | 'HOME' | 'COUPLE' | 'OTHER';
}

export interface UpdateGroupDto extends Partial<CreateGroupDto> {}
