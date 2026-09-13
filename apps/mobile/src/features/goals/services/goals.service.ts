import { api } from '@shared/lib/api';
import { ApiResponse } from '@shared/types';

export interface GoalItem {
  id: string; userId: string; name: string; targetAmount: number; currentAmount: number;
  deadline?: string; status: 'active' | 'completed' | 'cancelled'; createdAt: string;
  progressPercentage: number; remaining: number; projectedDate: string | null;
  monthsToComplete: number | null; contributionCount: number;
}

export interface CreateGoalData { name: string; targetAmount: number; deadline?: string; }
export interface CreateContributionData { amount: number; date: string; note?: string; }

export const goalsService = {
  findAll: async (): Promise<GoalItem[]> => {
    const res = await api.get<ApiResponse<GoalItem[]>>('/goals');
    return res.data.data;
  },
  create: async (data: CreateGoalData): Promise<GoalItem> => {
    const res = await api.post<ApiResponse<GoalItem>>('/goals', data);
    return res.data.data;
  },
  remove: async (id: string): Promise<void> => { await api.delete(`/goals/${id}`); },
  addContribution: async (goalId: string, data: CreateContributionData): Promise<GoalItem> => {
    const res = await api.post<ApiResponse<GoalItem>>(`/goals/${goalId}/contribute`, data);
    return res.data.data;
  },
};
