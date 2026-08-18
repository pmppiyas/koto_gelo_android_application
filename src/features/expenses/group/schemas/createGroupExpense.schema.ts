import { parseNumber } from '../../../../utils/number';

export const validateCreateGroupExpense = (values: {
  title?: string;
  amount?: string | number;
  paidById?: string;
  splits?: any[];
}) => {
  const errors: Record<string, string> = {};

  if (!values.title || values.title.trim().length === 0) {
    errors.title = 'Title is required';
  }

  const amt = parseNumber(values.amount || 0);
  if (amt <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }

  if (!values.paidById) {
    errors.paidById = 'Payer is required';
  }

  if (!values.splits || values.splits.length === 0) {
    errors.splits = 'At least one participant is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
