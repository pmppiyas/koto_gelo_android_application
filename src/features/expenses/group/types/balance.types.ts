export interface UserBalance {
  userId: string;
  userName: string;
  netBalance: number;
}

export interface GroupBalanceSummary {
  groupId: string;
  balances: UserBalance[];
  totalGroupSpending: number;
}
