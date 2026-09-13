import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { budgetsService, CreateBudgetData } from '../services/budgets.service';

const KEYS = { all: ['budgets'] as const, month: (m: number, y: number) => ['budgets', m, y] as const };

export function useBudgets(month: number, year: number) {
  return useQuery({ queryKey: KEYS.month(month, year), queryFn: () => budgetsService.findAll(month, year), staleTime: 1000 * 60 * 2 });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: CreateBudgetData) => budgetsService.create(data), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}

export function useDeleteBudget() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => budgetsService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }) });
}
