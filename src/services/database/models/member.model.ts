export interface MemberEntity {
  id: string;
  groupId: string;
  userId: string;
  name: string;
  email?: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
}
