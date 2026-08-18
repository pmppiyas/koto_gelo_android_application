import { parseNumber } from '../../../../utils/number';

export const validateCreatePersonalExpense = (values: {
  title?: string;
  amount?: string | number;
  category?: string;
}) => {
  const errors: Record<string, string> = {};

  if (!values.title || values.title.trim().length === 0) {
    errors.title = 'Title is required';
  }

  const amt = parseNumber(values.amount || 0);
  if (amt <= 0) {
    errors.amount = 'Amount must be greater than 0';
  }

  if (!values.category) {
    errors.category = 'Category is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
