export interface GroupEntity {
  id: string;
  name: string;
  description?: string;
  currency: string;
  category?: string;
  isSynced: boolean;
  createdAt: string;
  updatedAt: string;
}
