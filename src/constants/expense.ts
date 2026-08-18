export const EXPENSE_CATEGORIES = [
  'FOOD_AND_DINING',
  'GROCERIES',
  'TRANSPORTATION',
  'RENT_AND_UTILITIES',
  'ENTERTAINMENT',
  'HEALTHCARE',
  'SHOPPING',
  'TRAVEL',
  'EDUCATION',
  'OTHERS',
] as const;

export type ExpenseCategoryType = typeof EXPENSE_CATEGORIES[number];

export const SPLIT_TYPES = {
  EQUAL: 'EQUAL',
  EXACT: 'EXACT',
  PERCENTAGE: 'PERCENTAGE',
  SHARES: 'SHARES',
} as const;

export type SplitType = keyof typeof SPLIT_TYPES;
