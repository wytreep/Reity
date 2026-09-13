export interface MonthlyFlowItem {
  month: number;
  year: number;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export interface TransactionSummary {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
  byCategory: any[];
  monthlyFlow: MonthlyFlowItem[];
  transactions: any[];
}
