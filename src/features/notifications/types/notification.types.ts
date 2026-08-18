import { BaseEntity } from '../../../types/common.types';

export interface AppNotification extends BaseEntity {
  title: string;
  body: string;
  type: 'EXPENSE_ADDED' | 'SETTLEMENT_REQUEST' | 'INVITATION' | 'REMINDER';
  isRead: boolean;
  data?: Record<string, any>;
}
