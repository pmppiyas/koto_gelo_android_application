import { BaseEntity } from '../../../types/common.types';

export type InvitationStatusType = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface Invitation extends BaseEntity {
  groupId: string;
  groupName: string;
  inviterName: string;
  inviteeEmail: string;
  status: InvitationStatusType;
}
