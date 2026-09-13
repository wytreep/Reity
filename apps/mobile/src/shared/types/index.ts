export type TransactionType = 'income' | 'expense';
export type GoalStatus = 'active' | 'completed' | 'cancelled';

export interface ApiResponse<T> { statusCode: number; data: T; timestamp: string; }

export interface User { id: string; email: string; fullName: string; currency: string; createdAt: string; }

export interface Category {
  id: string; name: string; icon: string; color: string;
  type: TransactionType; isDefault: boolean;
}

export interface Transaction {
  id: string; userId: string; categoryId: string; category?: Category;
  amount: number; type: TransactionType; note?: string; date: string; createdAt: string;
}

export interface Budget {
  id: string; userId: string; categoryId: string; category?: Category;
  amount: number; month: number; year: number; rollover: boolean;
  spent?: number; percentage?: number;
}

export interface Goal {
  id: string; userId: string; name: string; targetAmount: number;
  currentAmount: number; deadline?: string; status: GoalStatus;
  createdAt: string; progressPercentage?: number;
}

export interface InflationRecord {
  month: number; year: number; ipcMonthly: number; ipcAnnual: number;
}
