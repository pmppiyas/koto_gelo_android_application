export const validateSettlement = (values: {
  amount?: number;
  fromUserId?: string;
  toUserId?: string;
}) => {
  const errors: Record<string, string> = {};

  if (!values.amount || values.amount <= 0) {
    errors.amount = 'Amount must be positive';
  }

  if (!values.fromUserId || !values.toUserId) {
    errors.participants = 'Both payer and receiver are required';
  }

  if (values.fromUserId === values.toUserId) {
    errors.participants = 'Payer and receiver cannot be the same';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
