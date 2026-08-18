import { GroupEntity } from '../models/group.model';

class GroupRepository {
  async getAll(): Promise<GroupEntity[]> {
    return [];
  }

  async getById(id: string): Promise<GroupEntity | null> {
    return null;
  }

  async create(group: Partial<GroupEntity>): Promise<GroupEntity> {
    return group as GroupEntity;
  }

  async update(id: string, updates: Partial<GroupEntity>): Promise<GroupEntity | null> {
    return null;
  }

  async delete(id: string): Promise<boolean> {
    return true;
  }
}

export const groupRepository = new GroupRepository();
