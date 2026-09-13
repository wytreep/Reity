import { api } from '@shared/lib/api';
import { ApiResponse, Category } from '@shared/types';

export interface BudgetItem {
  id: string; userId: string; categoryId: string; category: Category;
  amount: number; month: number; year: number; rollover: boolean;
  spent: number; remaining: number; percentage: number; status: 'ok' | 'warning' | 'exceeded';
}

export interface BudgetSummary {
  month: number; year: number; totalBudget: number; totalSpent: number; totalPercentage: number; budgets: BudgetItem[];
}

export interface CreateBudgetData { categoryId: string; amount: number; month: number; year: number; rollover?: boolean; }

export const budgetsService = {
  findAll: async (month: number, year: number): Promise<BudgetSummary> => {
    const res = await api.get<ApiResponse<BudgetSummary>>('/budgets', { params: { month, year } });
    return res.data.data;
  },
  create: async (data: CreateBudgetData): Promise<BudgetItem> => {
    const res = await api.post<ApiResponse<BudgetItem>>('/budgets', data);
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => { await api.delete(`/budgets/${id}`); },
};
