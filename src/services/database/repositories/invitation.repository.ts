export interface InvitationEntity {
  id: string;
  groupId: string;
  inviterId: string;
  inviteeEmail: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
  createdAt: string;
}

class InvitationRepository {
  async getAll(): Promise<InvitationEntity[]> {
    return [];
  }

  async getById(id: string): Promise<InvitationEntity | null> {
    return null;
  }

  async create(invitation: Partial<InvitationEntity>): Promise<InvitationEntity> {
    return invitation as InvitationEntity;
  }
}

export const invitationRepository = new InvitationRepository();
