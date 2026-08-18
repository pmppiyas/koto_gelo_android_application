export interface SettlementEntity {
  id: string;
  groupId: string;
  payerId: string;
  receiverId: string;
  amount: number;
  currency: string;
  isSettled: boolean;
  settledAt?: string;
  createdAt: string;
}
