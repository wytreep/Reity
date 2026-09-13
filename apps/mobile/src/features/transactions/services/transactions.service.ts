import { api } from '@shared/lib/api';
import { ApiResponse, Transaction } from '@shared/types';

export interface TransactionSummary {
  month: number; year: number; totalIncome: number; totalExpense: number; net: number;
  transactionCount: number; byCategory: any[];
  monthlyFlow: { month: number; year: number; label: string; income: number; expense: number; net: number; }[];
  transactions: Transaction[];
}

export interface CreateTransactionData {
  amount: number; type: 'income' | 'expense'; date: string; categoryId?: string; note?: string;
}

export const transactionsService = {
  findAll: async (filters?: any): Promise<Transaction[]> => {
    const res = await api.get<ApiResponse<Transaction[]>>('/transactions', { params: filters });
    return res.data.data;
  },
  getSummary: async (month: number, year: number): Promise<TransactionSummary> => {
    const res = await api.get<ApiResponse<TransactionSummary>>('/transactions/summary', { params: { month, year } });
    return res.data.data;
  },
  create: async (data: CreateTransactionData): Promise<Transaction> => {
    const res = await api.post<ApiResponse<Transaction>>('/transactions', data);
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => { await api.delete(`/transactions/${id}`); },
};
