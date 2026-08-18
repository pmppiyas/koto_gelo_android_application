import { ExpenseEntity } from '../models/expense.model';

class ExpenseRepository {
  async getAll(): Promise<ExpenseEntity[]> {
    return [];
  }

  async getById(id: string): Promise<ExpenseEntity | null> {
    return null;
  }

  async create(expense: Partial<ExpenseEntity>): Promise<ExpenseEntity> {
    return expense as ExpenseEntity;
  }

  async update(id: string, updates: Partial<ExpenseEntity>): Promise<ExpenseEntity | null> {
    return null;
  }

  async delete(id: string): Promise<boolean> {
    return true;
  }
}

export const expenseRepository = new ExpenseRepository();
