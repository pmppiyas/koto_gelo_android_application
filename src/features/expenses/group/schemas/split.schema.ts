export const validateSplit = (splits: { amount: number }[], totalAmount: number) => {
  const sum = splits.reduce((acc, s) => acc + s.amount, 0);
  const diff = Math.abs(sum - totalAmount);

  return {
    isValid: diff < 0.05,
    difference: diff,
  };
};
