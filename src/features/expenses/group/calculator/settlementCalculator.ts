import { UserBalance } from '../types/balance.types';
import { SettlementSuggestion } from '../types/settlement.types';
import { roundToTwoDecimals } from '../../../../utils/number';

export const calculateMinSettlements = (
  balances: UserBalance[],
  currency: string = 'BDT'
): SettlementSuggestion[] => {
  const debtors = balances
    .filter(b => b.netBalance < -0.01)
    .map(b => ({ ...b, balance: -b.netBalance }))
    .sort((a, b) => b.balance - a.balance);

  const creditors = balances
    .filter(b => b.netBalance > 0.01)
    .map(b => ({ ...b, balance: b.netBalance }))
    .sort((a, b) => b.balance - a.balance);

  const settlements: SettlementSuggestion[] = [];

  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount = Math.min(debtor.balance, creditor.balance);
    if (settleAmount > 0.01) {
      settlements.push({
        fromUserId: debtor.userId,
        fromUserName: debtor.userName,
        toUserId: creditor.userId,
        toUserName: creditor.userName,
        amount: roundToTwoDecimals(settleAmount),
        currency,
      });
    }

    debtor.balance -= settleAmount;
    creditor.balance -= settleAmount;

    if (debtor.balance < 0.01) dIdx++;
    if (creditor.balance < 0.01) cIdx++;
  }

  return settlements;
};
