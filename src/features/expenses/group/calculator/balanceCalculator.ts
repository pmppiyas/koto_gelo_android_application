import { GroupExpense } from '../types/groupExpense.types';
import { UserBalance } from '../types/balance.types';
import { roundToTwoDecimals } from '../../../../utils/number';

export const calculateGroupBalances = (
  expenses: GroupExpense[],
  members: { id: string; name: string }[]
): UserBalance[] => {
  const balanceMap = new Map<string, number>();

  members.forEach(m => balanceMap.set(m.id, 0));

  expenses.forEach(exp => {
    const paidBy = exp.paidById;
    balanceMap.set(paidBy, (balanceMap.get(paidBy) || 0) + exp.amount);

    exp.splits.forEach(split => {
      balanceMap.set(split.userId, (balanceMap.get(split.userId) || 0) - split.amount);
    });
  });

  return members.map(m => ({
    userId: m.id,
    userName: m.name,
    netBalance: roundToTwoDecimals(balanceMap.get(m.id) || 0),
  }));
};
