import { database } from '../database';
import { Group, GroupMember } from '../../groupService';

class GroupRepository {
  async getAll(): Promise<Group[]> {
    await database.init();
    const rows = await database.db.getAllAsync<any>(
      'SELECT * FROM groups WHERE status != ? ORDER BY createdAt DESC',
      ['ARCHIVED']
    );

    const members = await database.db.getAllAsync<any>(
      'SELECT * FROM group_members WHERE status = ?',
      ['ACTIVE']
    );

    const membersByGroup: Record<string, GroupMember[]> = {};
    const seenMembers = new Set<string>();

    members.forEach((m) => {
      const memberKey = `${m.groupId}_${m.userId}`;
      if (seenMembers.has(memberKey)) return;
      seenMembers.add(memberKey);

      let parsedUser: any = null;
      if (m.rawJson) {
        try {
          parsedUser = JSON.parse(m.rawJson);
        } catch {}
      }
      const memberObj: GroupMember = {
        id: m.id || memberKey,
        userId: m.userId,
        role: m.role as any,
        status: m.status as any,
        joinedAt: m.joinedAt,
        user: parsedUser?.user || {
          id: m.userId,
          username: parsedUser?.username || 'Member',
          name: parsedUser?.name || null,
          avatarUrl: parsedUser?.avatarUrl || null,
        },
      };

      if (!membersByGroup[m.groupId]) {
        membersByGroup[m.groupId] = [];
      }
      membersByGroup[m.groupId].push(memberObj);
    });

    return rows.map((r) => {
      let parsedGroup: any = null;
      if (r.rawJson) {
        try {
          parsedGroup = JSON.parse(r.rawJson);
        } catch {}
      }

      const groupMembers = membersByGroup[r.id] || parsedGroup?.members || [];
      const uniqueGroupMembers: GroupMember[] = [];
      const memberIdSet = new Set<string>();

      groupMembers.forEach((gm: any) => {
        const uId = gm.userId || gm.user?.id || gm.id;
        if (uId && !memberIdSet.has(uId)) {
          memberIdSet.add(uId);
          uniqueGroupMembers.push(gm);
        }
      });

      return {
        id: r.id,
        name: r.name,
        description: r.description || null,
        type: r.type as any,
        status: r.status as any,
        createdById: r.createdById,
        createdBy: parsedGroup?.createdBy,
        members: uniqueGroupMembers,
        _count: {
          members: uniqueGroupMembers.length,
          expenses: parsedGroup?._count?.expenses || 0,
        },
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      };
    });
  }

  async getById(id: string): Promise<Group | null> {
    await database.init();
    const all = await this.getAll();
    return all.find((g) => g.id === id) || null;
  }

  async save(group: Group, syncStatus = 'synced'): Promise<void> {
    await database.init();
    await database.db.runAsync(
      `INSERT OR REPLACE INTO groups (
        id, name, description, type, status, createdById, rawJson, syncStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        group.id,
        group.name || 'Group',
        group.description || null,
        group.type || 'OTHER',
        group.status || 'ACTIVE',
        group.createdById || (group as any).createdBy?.id || '',
        JSON.stringify(group),
        syncStatus,
        group.createdAt || new Date().toISOString(),
        group.updatedAt || new Date().toISOString(),
      ]
    );

    if (group.members && Array.isArray(group.members)) {
      const savedUserIds = new Set<string>();
      for (const m of group.members) {
        const memberUserId = m.userId || m.user?.id || '';
        if (!memberUserId || savedUserIds.has(memberUserId)) continue;
        savedUserIds.add(memberUserId);

        const memberId = m.id || `${group.id}_${memberUserId}`;

        // Clean up duplicate records for this member in this group
        await database.db.runAsync(
          'DELETE FROM group_members WHERE groupId = ? AND userId = ? AND id != ?',
          [group.id, memberUserId, memberId]
        );

        await database.db.runAsync(
          `INSERT OR REPLACE INTO group_members (
            id, groupId, userId, role, status, rawJson, joinedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            memberId,
            group.id,
            memberUserId,
            m.role || 'MEMBER',
            m.status || 'ACTIVE',
            JSON.stringify(m),
            m.joinedAt || new Date().toISOString(),
          ]
        );
      }
    }
  }

  async saveAll(groups: Group[]): Promise<void> {
    await database.init();
    for (const grp of groups) {
      await this.save(grp);
    }
  }

  async update(id: string, updates: Partial<Group>): Promise<void> {
    await database.init();
    const existing = await this.getById(id);
    if (!existing) return;

    const merged: Group = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.save(merged);
  }

  async delete(id: string): Promise<void> {
    await database.init();
    await database.db.runAsync('DELETE FROM groups WHERE id = ?', [id]);
    await database.db.runAsync('DELETE FROM group_members WHERE groupId = ?', [id]);
    await database.db.runAsync('DELETE FROM group_expenses WHERE groupId = ?', [id]);
    await database.db.runAsync('DELETE FROM group_deposits WHERE groupId = ?', [id]);
  }

  async clear(): Promise<void> {
    await database.init();
    await database.db.runAsync('DELETE FROM groups');
    await database.db.runAsync('DELETE FROM group_members');
  }
}

export const groupRepository = new GroupRepository();
