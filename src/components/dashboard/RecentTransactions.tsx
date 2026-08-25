import React from 'react';
import {
  ExpenseTableCard,
  ExpenseTableCardProps,
} from '../common/ExpenseTableCard';

export interface RecentTransactionsProps extends ExpenseTableCardProps {}

export const RecentTransactions: React.FC<RecentTransactionsProps> = props => {
  return <ExpenseTableCard {...props} />;
};

export { ExpenseTableCard };

export default RecentTransactions;
