import { database } from '../database';

export interface LocalInvitation {
  id: string;
  groupId: string;
  invitedById: string;
  inviteeId: string;
  type: string;
  status: string;
  group?: any;
  invitedBy?: any;
  invitee?: any;
  createdAt: string;
}

class InvitationRepository {
  async getAll(groupId?: string): Promise<LocalInvitation[]> {
    await database.init();
    let sql = 'SELECT * FROM group_invitations';
    const params: any[] = [];

    if (groupId) {
      sql += ' WHERE groupId = ?';
      params.push(groupId);
    }
    sql += ' ORDER BY createdAt DESC';

    const rows = await database.db.getAllAsync<any>(sql, params);

    return rows.map((r) => {
      let parsed: any = null;
      if (r.rawJson) {
        try {
          parsed = JSON.parse(r.rawJson);
        } catch {}
      }

      return {
        id: r.id,
        groupId: r.groupId,
        invitedById: r.invitedById,
        inviteeId: r.inviteeId,
        type: r.type,
        status: r.status,
        group: parsed?.group,
        invitedBy: parsed?.invitedBy,
        invitee: parsed?.invitee,
        createdAt: r.createdAt,
      };
    });
  }

  async save(invitation: any): Promise<void> {
    await database.init();
    await database.db.runAsync(
      `INSERT OR REPLACE INTO group_invitations (
        id, groupId, invitedById, inviteeId, type, status, rawJson, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invitation.id,
        invitation.groupId,
        invitation.invitedById || invitation.invitedBy?.id,
        invitation.inviteeId || invitation.invitee?.id,
        invitation.type || 'INVITATION',
        invitation.status || 'PENDING',
        JSON.stringify(invitation),
        invitation.createdAt || new Date().toISOString(),
      ]
    );
  }

  async saveAll(invitations: any[]): Promise<void> {
    await database.init();
    for (const inv of invitations) {
      await this.save(inv);
    }
  }

  async delete(id: string): Promise<void> {
    await database.init();
    await database.db.runAsync('DELETE FROM group_invitations WHERE id = ?', [id]);
  }

  async clear(): Promise<void> {
    await database.init();
    await database.db.runAsync('DELETE FROM group_invitations');
  }
}

export const invitationRepository = new InvitationRepository();
