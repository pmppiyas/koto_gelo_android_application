import { SplitCalculationInput, SplitDetail } from '../types/split.types';
import { roundToTwoDecimals } from '../../../../utils/number';

export const calculateSplits = (input: SplitCalculationInput): SplitDetail[] => {
  const { totalAmount, splitType, participants } = input;
  const count = participants.length;

  if (count === 0) return [];

  if (splitType === 'EQUAL') {
    const share = roundToTwoDecimals(totalAmount / count);
    return participants.map((p, idx) => ({
      userId: p.userId,
      amount: idx === count - 1 ? roundToTwoDecimals(totalAmount - share * (count - 1)) : share,
    }));
  }

  if (splitType === 'EXACT') {
    return participants.map(p => ({
      userId: p.userId,
      amount: p.customValue || 0,
    }));
  }

  if (splitType === 'PERCENTAGE') {
    return participants.map(p => ({
      userId: p.userId,
      percentage: p.customValue || 0,
      amount: roundToTwoDecimals((totalAmount * (p.customValue || 0)) / 100),
    }));
  }

  if (splitType === 'SHARES') {
    const totalShares = participants.reduce((acc, p) => acc + (p.customValue || 1), 0);
    return participants.map(p => {
      const share = p.customValue || 1;
      return {
        userId: p.userId,
        shares: share,
        amount: totalShares > 0 ? roundToTwoDecimals((totalAmount * share) / totalShares) : 0,
      };
    });
  }

  return [];
};
