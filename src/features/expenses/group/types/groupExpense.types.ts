import { BaseEntity } from '../../../types/common.types';
import { SplitType, ExpenseCategoryType } from '../../../constants/expense';
import { SplitDetail } from './split.types';

export interface GroupExpense extends BaseEntity {
  groupId: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategoryType;
  paidById: string;
  splitType: SplitType;
  splits: SplitDetail[];
  date: string;
  notes?: string;
}

export interface CreateGroupExpenseDto {
  groupId: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategoryType;
  paidById: string;
  splitType: SplitType;
  splits: SplitDetail[];
  date: string;
  notes?: string;
}

export interface UpdateGroupExpenseDto extends Partial<CreateGroupExpenseDto> {}
