import { BaseEntity } from '../../../types/common.types';
import { ExpenseCategoryType } from '../../../constants/expense';

export interface PersonalExpense extends BaseEntity {
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategoryType;
  date: string;
  notes?: string;
}

export interface CreatePersonalExpenseDto {
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategoryType;
  date: string;
  notes?: string;
}

export interface UpdatePersonalExpenseDto extends Partial<CreatePersonalExpenseDto> {}
