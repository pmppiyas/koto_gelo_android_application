export type InvitationStatusType = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';
export type InvitationType = 'INVITATION' | 'JOIN_REQUEST';

export interface InvitationUser {
  id: string;
  username: string;
  name?: string | null;
  avatarUrl?: string | null;
}

export interface InvitationGroup {
  id: string;
  name: string;
  type?: string;
}

export interface Invitation {
  id: string;
  groupId: string;
  groupName: string;
  groupType?: string;
  group?: InvitationGroup;
  invitedById: string;
  inviterName: string;
  inviterUsername?: string;
  invitedBy?: InvitationUser;
  inviteeId?: string;
  invitee?: InvitationUser;
  inviteeEmail?: string;
  type: InvitationType;
  status: InvitationStatusType;
  createdAt: string;
  respondedAt?: string | null;
}
