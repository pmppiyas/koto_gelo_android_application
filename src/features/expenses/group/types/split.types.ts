export interface SplitDetail {
  userId: string;
  amount: number;
  percentage?: number;
  shares?: number;
}

export interface SplitCalculationInput {
  totalAmount: number;
  splitType: 'EQUAL' | 'EXACT' | 'PERCENTAGE' | 'SHARES';
  participants: {
    userId: string;
    customValue?: number;
  }[];
}
